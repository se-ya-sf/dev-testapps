import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Task, Prisma } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { ChangeLogService } from '../changelog/changelog.service';
import { DependenciesService } from '../dependencies/dependencies.service';

// String types for SQLite compatibility
type TaskType = 'task' | 'summary' | 'milestone';
type TaskStatus = 'NotStarted' | 'InProgress' | 'Blocked' | 'Done';

export type ScheduleWarning = 'SCHEDULE_MISSING_DATES' | 'SCHEDULE_VIOLATION';

export interface TaskWithWarnings extends Task {
  hasScheduleWarning: boolean;
  scheduleWarnings: ScheduleWarning[];
  actualPd: number | null;
}

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private changeLogService: ChangeLogService,
    @Inject(forwardRef(() => DependenciesService))
    private dependenciesService: DependenciesService,
  ) {}

  async create(projectId: string, dto: CreateTaskDto, userId: string): Promise<TaskWithWarnings> {
    // Validate parent if specified
    if (dto.parentId) {
      const parent = await this.prisma.task.findFirst({
        where: { id: dto.parentId, projectId, deletedAt: null },
      });
      if (!parent) {
        throw new NotFoundException('Parent task not found');
      }
    }

    // Get max orderIndex for the parent level
    const maxOrder = await this.prisma.task.aggregate({
      where: { projectId, parentId: dto.parentId || null, deletedAt: null },
      _max: { orderIndex: true },
    });

    const task = await this.prisma.task.create({
      data: {
        projectId,
        parentId: dto.parentId || null,
        orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        progress: dto.progress ?? 0,
        status: dto.status ?? 'NotStarted',
        priority: dto.priority,
        estimatePd: dto.estimatePd,
        assignees: dto.assigneeIds
          ? {
              create: dto.assigneeIds.map((userId) => ({
                userId,
                isPrimary: false,
              })),
            }
          : undefined,
      },
      include: {
        assignees: true,
      },
    });

    await this.changeLogService.log({
      entityType: 'Task',
      entityId: task.id,
      userId,
      field: 'created',
      before: null,
      after: JSON.stringify({ title: task.title, type: task.type }),
    });

    return this.enrichTaskWithWarnings(task);
  }

  async findAll(
    projectId: string,
    includeDeleted: boolean = false,
  ): Promise<TaskWithWarnings[]> {
    const where: Prisma.TaskWhereInput = { projectId };
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        assignees: {
          include: { user: { select: { id: true, email: true, displayName: true } } },
        },
      },
      orderBy: [{ parentId: 'asc' }, { orderIndex: 'asc' }],
    });

    // Get actual PD for all tasks
    const taskIds = tasks.map((t) => t.id);
    const timeLogSums = await this.prisma.timeLog.groupBy({
      by: ['taskId'],
      where: { taskId: { in: taskIds } },
      _sum: { pd: true },
    });
    const actualPdMap = new Map(timeLogSums.map((t) => [t.taskId, t._sum.pd || 0]));

    // Get dependencies for warning calculation
    const dependencies = await this.prisma.dependency.findMany({
      where: { projectId },
    });

    return tasks.map((task) => 
      this.enrichTaskWithWarnings(task, actualPdMap.get(task.id), dependencies)
    );
  }

  async findOne(taskId: string): Promise<TaskWithWarnings> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: {
          include: { user: { select: { id: true, email: true, displayName: true } } },
        },
      },
    });

    if (!task || task.deletedAt) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    // Get actual PD
    const timeLogSum = await this.prisma.timeLog.aggregate({
      where: { taskId },
      _sum: { pd: true },
    });

    // Get dependencies
    const dependencies = await this.prisma.dependency.findMany({
      where: {
        OR: [{ predecessorTaskId: taskId }, { successorTaskId: taskId }],
      },
    });

    return this.enrichTaskWithWarnings(task, timeLogSum._sum.pd, dependencies);
  }

  async update(
    taskId: string,
    dto: UpdateTaskDto,
    userId: string,
  ): Promise<{ updatedTask: TaskWithWarnings; affectedTasks: TaskWithWarnings[] }> {
    const existing = await this.findOne(taskId);

    // Validate: Summary tasks cannot have dates edited directly
    if (existing.type === 'summary') {
      if (dto.startDate !== undefined || dto.endDate !== undefined) {
        throw new BadRequestException('Summary task dates are calculated from children');
      }
    }

    const data: Prisma.TaskUpdateInput = {};
    const changes: { field: string; before: any; after: any }[] = [];

    // Handle status + progress sync (RULE-PROG-01)
    if (dto.status === 'Done') {
      dto.progress = 100;
    }

    if (dto.title !== undefined) {
      data.title = dto.title;
      changes.push({ field: 'title', before: existing.title, after: dto.title });
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
      changes.push({ field: 'description', before: existing.description, after: dto.description });
    }

    if (dto.startDate !== undefined) {
      const newDate = dto.startDate ? new Date(dto.startDate) : null;
      data.startDate = newDate;
      changes.push({
        field: 'startDate',
        before: existing.startDate?.toISOString().split('T')[0] || null,
        after: dto.startDate || null,
      });
    }

    if (dto.endDate !== undefined) {
      const newDate = dto.endDate ? new Date(dto.endDate) : null;
      data.endDate = newDate;
      changes.push({
        field: 'endDate',
        before: existing.endDate?.toISOString().split('T')[0] || null,
        after: dto.endDate || null,
      });
    }

    if (dto.progress !== undefined) {
      data.progress = dto.progress;
      changes.push({ field: 'progress', before: existing.progress, after: dto.progress });
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
      changes.push({ field: 'status', before: existing.status, after: dto.status });
    }

    if (dto.priority !== undefined) {
      data.priority = dto.priority;
      changes.push({ field: 'priority', before: existing.priority, after: dto.priority });
    }

    if (dto.estimatePd !== undefined) {
      data.estimatePd = dto.estimatePd;
      changes.push({ field: 'estimatePd', before: existing.estimatePd, after: dto.estimatePd });
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data,
      include: {
        assignees: true,
      },
    });

    // Handle assignees update separately
    if (dto.assigneeIds !== undefined) {
      await this.prisma.taskAssignee.deleteMany({ where: { taskId } });
      if (dto.assigneeIds.length > 0) {
        await this.prisma.taskAssignee.createMany({
          data: dto.assigneeIds.map((userId) => ({
            taskId,
            userId,
            isPrimary: false,
          })),
        });
      }
    }

    // Log changes
    for (const change of changes) {
      await this.changeLogService.log({
        entityType: 'Task',
        entityId: taskId,
        userId,
        field: change.field,
        before: String(change.before),
        after: String(change.after),
      });
    }

    // Auto-schedule propagation if date changed
    let affectedTasks: TaskWithWarnings[] = [];
    const project = await this.prisma.project.findUnique({
      where: { id: existing.projectId },
    });

    if (
      project?.autoSchedule &&
      (dto.startDate !== undefined || dto.endDate !== undefined)
    ) {
      affectedTasks = await this.propagateSchedule(existing.projectId, taskId, userId);
    }

    // Update parent summary if this task has a parent
    if (existing.parentId) {
      await this.recalculateSummary(existing.parentId);
    }

    const enrichedTask = await this.findOne(taskId);

    return {
      updatedTask: enrichedTask,
      affectedTasks,
    };
  }

  async delete(taskId: string, userId: string): Promise<void> {
    const task = await this.findOne(taskId);

    // Soft delete
    await this.prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });

    await this.changeLogService.log({
      entityType: 'Task',
      entityId: taskId,
      userId,
      field: 'deleted',
      before: JSON.stringify({ title: task.title }),
      after: null,
    });

    // Recalculate parent summary if exists
    if (task.parentId) {
      await this.recalculateSummary(task.parentId);
    }
  }

  async move(
    taskId: string,
    dto: MoveTaskDto,
    userId: string,
  ): Promise<{ movedTaskId: string }> {
    const task = await this.findOne(taskId);

    // Validate new parent if specified
    if (dto.newParentId) {
      const newParent = await this.prisma.task.findFirst({
        where: { id: dto.newParentId, projectId: task.projectId, deletedAt: null },
      });
      if (!newParent) {
        throw new NotFoundException('New parent task not found');
      }
      // Prevent moving to own descendant
      if (await this.isDescendant(dto.newParentId, taskId)) {
        throw new BadRequestException('Cannot move task to its own descendant');
      }
    }

    const oldParentId = task.parentId;

    // Calculate new orderIndex
    let newOrderIndex: number;
    if (dto.afterTaskId) {
      const afterTask = await this.prisma.task.findUnique({
        where: { id: dto.afterTaskId },
      });
      if (!afterTask) {
        throw new NotFoundException('After task not found');
      }
      newOrderIndex = afterTask.orderIndex + 1;

      // Shift other tasks
      await this.prisma.task.updateMany({
        where: {
          projectId: task.projectId,
          parentId: dto.newParentId ?? null,
          orderIndex: { gte: newOrderIndex },
          deletedAt: null,
        },
        data: { orderIndex: { increment: 1 } },
      });
    } else {
      // Move to beginning
      newOrderIndex = 0;
      await this.prisma.task.updateMany({
        where: {
          projectId: task.projectId,
          parentId: dto.newParentId ?? null,
          deletedAt: null,
        },
        data: { orderIndex: { increment: 1 } },
      });
    }

    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        parentId: dto.newParentId ?? null,
        orderIndex: newOrderIndex,
      },
    });

    await this.changeLogService.log({
      entityType: 'Task',
      entityId: taskId,
      userId,
      field: 'moved',
      before: JSON.stringify({ parentId: oldParentId }),
      after: JSON.stringify({ parentId: dto.newParentId }),
    });

    // Recalculate summaries
    if (oldParentId) {
      await this.recalculateSummary(oldParentId);
    }
    if (dto.newParentId) {
      await this.recalculateSummary(dto.newParentId);
    }

    return { movedTaskId: taskId };
  }

  // Helper: Check if potentialDescendant is a descendant of ancestorId
  private async isDescendant(potentialDescendantId: string, ancestorId: string): Promise<boolean> {
    let current = potentialDescendantId;
    const visited = new Set<string>();

    while (current) {
      if (visited.has(current)) break;
      visited.add(current);

      if (current === ancestorId) return true;

      const task = await this.prisma.task.findUnique({
        where: { id: current },
        select: { parentId: true },
      });
      if (!task?.parentId) break;
      current = task.parentId;
    }

    return false;
  }

  // Recalculate summary task dates and progress from children
  async recalculateSummary(summaryId: string): Promise<void> {
    const summary = await this.prisma.task.findUnique({
      where: { id: summaryId },
    });
    if (!summary || summary.type !== 'summary') return;

    const children = await this.prisma.task.findMany({
      where: { parentId: summaryId, deletedAt: null },
    });

    if (children.length === 0) return;

    // Calculate min startDate and max endDate from children with valid dates
    const validStartDates = children
      .filter((c) => c.startDate)
      .map((c) => c.startDate!);
    const validEndDates = children
      .filter((c) => c.endDate)
      .map((c) => c.endDate!);

    const minStart = validStartDates.length > 0
      ? new Date(Math.min(...validStartDates.map((d) => d.getTime())))
      : null;
    const maxEnd = validEndDates.length > 0
      ? new Date(Math.max(...validEndDates.map((d) => d.getTime())))
      : null;

    // Calculate weighted progress
    let totalWeight = 0;
    let weightedProgress = 0;
    for (const child of children) {
      const weight = child.estimatePd ?? 1;
      totalWeight += weight;
      weightedProgress += child.progress * weight;
    }
    const avgProgress = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;

    await this.prisma.task.update({
      where: { id: summaryId },
      data: {
        startDate: minStart,
        endDate: maxEnd,
        progress: avgProgress,
      },
    });

    // Recursively update parent summaries
    if (summary.parentId) {
      await this.recalculateSummary(summary.parentId);
    }
  }

  // Auto-schedule propagation (RULE-SCH-01 to SCH-04)
  async propagateSchedule(
    projectId: string,
    changedTaskId: string,
    userId: string,
  ): Promise<TaskWithWarnings[]> {
    const affectedTasks: TaskWithWarnings[] = [];

    // Get all dependencies where the changed task is a predecessor
    const dependencies = await this.prisma.dependency.findMany({
      where: { predecessorTaskId: changedTaskId },
      include: { predecessorTask: true, successorTask: true },
    });

    for (const dep of dependencies) {
      const pred = dep.predecessorTask;
      const succ = dep.successorTask;

      // Skip if dates are missing (RULE-SCH-02)
      if (!pred.endDate || !succ.startDate || !succ.endDate) {
        continue;
      }

      // Calculate minimum start date for successor
      const predEndTime = pred.endDate.getTime();
      const lagMs = dep.lagDays * 24 * 60 * 60 * 1000;
      const minStartTime = predEndTime + lagMs + 24 * 60 * 60 * 1000; // +1 day
      const minStart = new Date(minStartTime);

      // Only adjust if successor starts before minStart (RULE-SCH-03)
      if (succ.startDate.getTime() < minStartTime) {
        // Calculate duration to maintain
        const durationMs = succ.endDate.getTime() - succ.startDate.getTime();
        const newEndDate = new Date(minStartTime + durationMs);

        await this.prisma.task.update({
          where: { id: succ.id },
          data: {
            startDate: minStart,
            endDate: newEndDate,
          },
        });

        await this.changeLogService.log({
          entityType: 'Task',
          entityId: succ.id,
          userId,
          field: 'auto-scheduled',
          before: JSON.stringify({
            startDate: succ.startDate.toISOString().split('T')[0],
            endDate: succ.endDate.toISOString().split('T')[0],
          }),
          after: JSON.stringify({
            startDate: minStart.toISOString().split('T')[0],
            endDate: newEndDate.toISOString().split('T')[0],
          }),
        });

        const enriched = await this.findOne(succ.id);
        affectedTasks.push(enriched);

        // Recursively propagate
        const cascaded = await this.propagateSchedule(projectId, succ.id, userId);
        affectedTasks.push(...cascaded);
      }
    }

    return affectedTasks;
  }

  // Add warnings to task
  private enrichTaskWithWarnings(
    task: any,
    actualPd?: number | null,
    dependencies?: any[],
  ): TaskWithWarnings {
    const warnings: ScheduleWarning[] = [];

    if (dependencies) {
      // Check for SCHEDULE_MISSING_DATES
      const asPredecessor = dependencies.filter((d) => d.predecessorTaskId === task.id);
      const asSuccessor = dependencies.filter((d) => d.successorTaskId === task.id);

      for (const dep of asSuccessor) {
        const pred = dependencies.find((d) => d.predecessorTaskId === dep.predecessorTaskId);
        if (!task.startDate || !task.endDate) {
          if (!warnings.includes('SCHEDULE_MISSING_DATES')) {
            warnings.push('SCHEDULE_MISSING_DATES');
          }
        }
      }

      // Check for SCHEDULE_VIOLATION (when autoSchedule is off)
      for (const dep of asSuccessor) {
        const predTask = dep.predecessorTask;
        if (predTask?.endDate && task.startDate) {
          const minStart = new Date(predTask.endDate.getTime() + dep.lagDays * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000);
          if (task.startDate < minStart) {
            if (!warnings.includes('SCHEDULE_VIOLATION')) {
              warnings.push('SCHEDULE_VIOLATION');
            }
          }
        }
      }
    }

    return {
      ...task,
      hasScheduleWarning: warnings.length > 0,
      scheduleWarnings: warnings,
      actualPd: actualPd ?? null,
    };
  }
}
