import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Project, Prisma } from '@prisma/client';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ChangeLogService } from '../changelog/changelog.service';

// String types for SQLite compatibility
type ProjectStatus = 'Planning' | 'Active' | 'OnHold' | 'Done' | 'Archived';
type Role = 'Admin' | 'PM' | 'Manager' | 'Contributor' | 'Viewer';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private changeLogService: ChangeLogService,
  ) {}

  async create(dto: CreateProjectDto, userId: string): Promise<Project> {
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        timezone: dto.timezone || 'Asia/Tokyo',
        autoSchedule: dto.autoSchedule ?? true,
        status: 'Planning' as ProjectStatus,
        members: {
          create: {
            userId,
            role: 'PM', // Creator becomes PM
          },
        },
      },
    });

    await this.changeLogService.log({
      entityType: 'Project',
      entityId: project.id,
      userId,
      field: 'created',
      before: null,
      after: JSON.stringify({ name: project.name }),
    });

    return project;
  }

  async findAll(
    userId: string,
    query?: { status?: string; q?: string },
  ): Promise<Project[]> {
    // Find projects where user is a member
    const memberProjects = await this.prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });

    const projectIds = memberProjects.map((m) => m.projectId);

    const where: Prisma.ProjectWhereInput = {
      id: { in: projectIds },
    };

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.q) {
      where.OR = [
        { name: { contains: query.q } },
        { description: { contains: query.q } },
      ];
    }

    return this.prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto, userId: string): Promise<Project> {
    const existing = await this.findOne(id);

    const data: Prisma.ProjectUpdateInput = {};

    // Track changes for change log
    const changes: { field: string; before: any; after: any }[] = [];

    if (dto.name !== undefined && dto.name !== existing.name) {
      data.name = dto.name;
      changes.push({ field: 'name', before: existing.name, after: dto.name });
    }

    if (dto.description !== undefined && dto.description !== existing.description) {
      data.description = dto.description;
      changes.push({ field: 'description', before: existing.description, after: dto.description });
    }

    if (dto.startDate !== undefined) {
      const newDate = dto.startDate ? new Date(dto.startDate) : null;
      data.startDate = newDate;
      changes.push({
        field: 'startDate',
        before: existing.startDate?.toISOString() || null,
        after: newDate?.toISOString() || null,
      });
    }

    if (dto.endDate !== undefined) {
      const newDate = dto.endDate ? new Date(dto.endDate) : null;
      data.endDate = newDate;
      changes.push({
        field: 'endDate',
        before: existing.endDate?.toISOString() || null,
        after: newDate?.toISOString() || null,
      });
    }

    if (dto.autoSchedule !== undefined && dto.autoSchedule !== existing.autoSchedule) {
      data.autoSchedule = dto.autoSchedule;
      changes.push({ field: 'autoSchedule', before: existing.autoSchedule, after: dto.autoSchedule });
    }

    if (dto.status !== undefined && dto.status !== existing.status) {
      data.status = dto.status;
      changes.push({ field: 'status', before: existing.status, after: dto.status });
    }

    const project = await this.prisma.project.update({
      where: { id },
      data,
    });

    // Log changes
    for (const change of changes) {
      await this.changeLogService.log({
        entityType: 'Project',
        entityId: id,
        userId,
        field: change.field,
        before: String(change.before),
        after: String(change.after),
      });
    }

    return project;
  }

  // Member management
  async getMembers(projectId: string) {
    await this.findOne(projectId); // Verify project exists

    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });
  }

  async addMember(
    projectId: string,
    email: string,
    role: Role,
    actorUserId: string,
  ) {
    await this.findOne(projectId);

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    // Check if already a member
    const existing = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      throw new ForbiddenException('User is already a member of this project');
    }

    const member = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    await this.changeLogService.log({
      entityType: 'ProjectMember',
      entityId: member.id,
      userId: actorUserId,
      field: 'added',
      before: null,
      after: JSON.stringify({ email, role }),
    });

    return member;
  }

  async updateMemberRole(
    projectId: string,
    userId: string,
    role: Role,
    actorUserId: string,
  ) {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const oldRole = member.role;

    const updated = await this.prisma.projectMember.update({
      where: { id: member.id },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    await this.changeLogService.log({
      entityType: 'ProjectMember',
      entityId: member.id,
      userId: actorUserId,
      field: 'role',
      before: oldRole,
      after: role,
    });

    return updated;
  }
}
