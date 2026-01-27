import { PrismaClient } from '@prisma/client';

// String types for SQLite compatibility
type TaskType = 'task' | 'summary' | 'milestone';
type TaskStatus = 'NotStarted' | 'InProgress' | 'Blocked' | 'Done';
type ProjectStatus = 'Planning' | 'Active' | 'OnHold' | 'Done' | 'Archived';
type Role = 'Admin' | 'PM' | 'Manager' | 'Contributor' | 'Viewer';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      entraOid: 'mock-admin-oid',
      email: 'admin@example.com',
      displayName: 'Admin User',
    },
  });

  const pmUser = await prisma.user.upsert({
    where: { email: 'pm@example.com' },
    update: {},
    create: {
      entraOid: 'mock-pm-oid',
      email: 'pm@example.com',
      displayName: 'Project Manager',
    },
  });

  const devUser = await prisma.user.upsert({
    where: { email: 'dev@example.com' },
    update: {},
    create: {
      entraOid: 'mock-dev-oid',
      email: 'dev@example.com',
      displayName: 'Developer',
    },
  });

  console.log('✅ Users created');

  // Create a sample project
  const project = await prisma.project.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Sample WBS Project',
      description: 'A sample project for testing WBS functionality',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30'),
      timezone: 'Asia/Tokyo',
      autoSchedule: true,
      status: 'Active' as ProjectStatus,
    },
  });

  console.log('✅ Project created');

  // Add project members
  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: adminUser.id,
      },
    },
    update: {},
    create: {
      projectId: project.id,
      userId: adminUser.id,
      role: 'Admin' as Role,
    },
  });

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: pmUser.id,
      },
    },
    update: {},
    create: {
      projectId: project.id,
      userId: pmUser.id,
      role: 'PM' as Role,
    },
  });

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: devUser.id,
      },
    },
    update: {},
    create: {
      projectId: project.id,
      userId: devUser.id,
      role: 'Contributor' as Role,
    },
  });

  console.log('✅ Project members added');

  // Create WBS tasks
  const phase1 = await prisma.task.create({
    data: {
      projectId: project.id,
      type: 'summary' as TaskType,
      title: 'Phase 1: Planning',
      orderIndex: 0,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
      progress: 100,
      status: 'Done' as TaskStatus,
    },
  });

  await prisma.task.create({
    data: {
      projectId: project.id,
      parentId: phase1.id,
      type: 'task' as TaskType,
      title: 'Requirements Gathering',
      orderIndex: 0,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-15'),
      progress: 100,
      status: 'Done' as TaskStatus,
      estimatePd: 10,
    },
  });

  await prisma.task.create({
    data: {
      projectId: project.id,
      parentId: phase1.id,
      type: 'task' as TaskType,
      title: 'System Design',
      orderIndex: 1,
      startDate: new Date('2026-01-16'),
      endDate: new Date('2026-01-31'),
      progress: 100,
      status: 'Done' as TaskStatus,
      estimatePd: 8,
    },
  });

  const phase2 = await prisma.task.create({
    data: {
      projectId: project.id,
      type: 'summary' as TaskType,
      title: 'Phase 2: Development',
      orderIndex: 1,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-04-30'),
      progress: 50,
      status: 'InProgress' as TaskStatus,
    },
  });

  const backendTask = await prisma.task.create({
    data: {
      projectId: project.id,
      parentId: phase2.id,
      type: 'task' as TaskType,
      title: 'Backend Development',
      orderIndex: 0,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-03-15'),
      progress: 80,
      status: 'InProgress' as TaskStatus,
      estimatePd: 30,
      assignees: {
        create: {
          userId: devUser.id,
          isPrimary: true,
        },
      },
    },
  });

  const frontendTask = await prisma.task.create({
    data: {
      projectId: project.id,
      parentId: phase2.id,
      type: 'task' as TaskType,
      title: 'Frontend Development',
      orderIndex: 1,
      startDate: new Date('2026-02-15'),
      endDate: new Date('2026-04-15'),
      progress: 40,
      status: 'InProgress' as TaskStatus,
      estimatePd: 25,
    },
  });

  await prisma.task.create({
    data: {
      projectId: project.id,
      parentId: phase2.id,
      type: 'task' as TaskType,
      title: 'Integration Testing',
      orderIndex: 2,
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-30'),
      progress: 0,
      status: 'NotStarted' as TaskStatus,
      estimatePd: 10,
    },
  });

  const phase3 = await prisma.task.create({
    data: {
      projectId: project.id,
      type: 'summary' as TaskType,
      title: 'Phase 3: Deployment',
      orderIndex: 2,
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-06-30'),
      progress: 0,
      status: 'NotStarted' as TaskStatus,
    },
  });

  await prisma.task.create({
    data: {
      projectId: project.id,
      parentId: phase3.id,
      type: 'task' as TaskType,
      title: 'UAT',
      orderIndex: 0,
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-05-31'),
      progress: 0,
      status: 'NotStarted' as TaskStatus,
      estimatePd: 15,
    },
  });

  const goLive = await prisma.task.create({
    data: {
      projectId: project.id,
      parentId: phase3.id,
      type: 'milestone' as TaskType,
      title: 'Go Live',
      orderIndex: 1,
      startDate: new Date('2026-06-30'),
      endDate: new Date('2026-06-30'),
      progress: 0,
      status: 'NotStarted' as TaskStatus,
    },
  });

  console.log('✅ Tasks created');

  // Create dependencies
  await prisma.dependency.create({
    data: {
      projectId: project.id,
      predecessorTaskId: backendTask.id,
      successorTaskId: frontendTask.id,
      type: 'FS',
      lagDays: 0,
    },
  });

  console.log('✅ Dependencies created');

  // Create a baseline
  const tasks = await prisma.task.findMany({
    where: { projectId: project.id },
  });

  const baseline = await prisma.baseline.create({
    data: {
      projectId: project.id,
      name: 'Initial Baseline',
      locked: true,
      baselineTasks: {
        create: tasks.map((task) => ({
          taskId: task.id,
          startDate: task.startDate,
          endDate: task.endDate,
          estimatePd: task.estimatePd,
          progress: task.progress,
          status: task.status,
        })),
      },
    },
  });

  console.log('✅ Baseline created');

  // Add some time logs
  await prisma.timeLog.create({
    data: {
      taskId: backendTask.id,
      userId: devUser.id,
      workDate: new Date('2026-02-01'),
      pd: 1,
      note: 'Initial setup',
    },
  });

  await prisma.timeLog.create({
    data: {
      taskId: backendTask.id,
      userId: devUser.id,
      workDate: new Date('2026-02-02'),
      pd: 1,
      note: 'API development',
    },
  });

  console.log('✅ Time logs created');

  // Add a comment
  await prisma.comment.create({
    data: {
      taskId: backendTask.id,
      userId: pmUser.id,
      body: 'Great progress! @dev@example.com please update the status when complete.',
    },
  });

  console.log('✅ Comments created');

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
