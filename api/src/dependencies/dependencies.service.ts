import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Dependency } from '@prisma/client';
import { CreateDependencyDto } from './dto/create-dependency.dto';

// String type for SQLite compatibility
type DependencyType = 'FS';
import { ChangeLogService } from '../changelog/changelog.service';
import { TasksService, TaskWithWarnings } from '../tasks/tasks.service';

@Injectable()
export class DependenciesService {
  constructor(
    private prisma: PrismaService,
    private changeLogService: ChangeLogService,
    @Inject(forwardRef(() => TasksService))
    private tasksService: TasksService,
  ) {}

  async create(
    projectId: string,
    dto: CreateDependencyDto,
    userId: string,
  ): Promise<{ dependency: Dependency; affectedTasks: TaskWithWarnings[] }> {
    // Validate tasks exist and belong to the project
    const [predecessor, successor] = await Promise.all([
      this.prisma.task.findFirst({
        where: { id: dto.predecessorTaskId, projectId, deletedAt: null },
      }),
      this.prisma.task.findFirst({
        where: { id: dto.successorTaskId, projectId, deletedAt: null },
      }),
    ]);

    if (!predecessor) {
      throw new NotFoundException('Predecessor task not found');
    }
    if (!successor) {
      throw new NotFoundException('Successor task not found');
    }

    // Check for circular dependency
    if (await this.wouldCreateCycle(dto.predecessorTaskId, dto.successorTaskId, projectId)) {
      throw new BadRequestException('Circular dependency detected');
    }

    // Check for duplicate
    const existing = await this.prisma.dependency.findUnique({
      where: {
        predecessorTaskId_successorTaskId: {
          predecessorTaskId: dto.predecessorTaskId,
          successorTaskId: dto.successorTaskId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Dependency already exists');
    }

    const dependency = await this.prisma.dependency.create({
      data: {
        projectId,
        predecessorTaskId: dto.predecessorTaskId,
        successorTaskId: dto.successorTaskId,
        type: dto.type || 'FS',
        lagDays: dto.lagDays || 0,
      },
    });

    await this.changeLogService.log({
      entityType: 'Dependency',
      entityId: dependency.id,
      userId,
      field: 'created',
      before: null,
      after: JSON.stringify({
        predecessor: dto.predecessorTaskId,
        successor: dto.successorTaskId,
        lagDays: dto.lagDays || 0,
      }),
    });

    // Auto-schedule if enabled
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    let affectedTasks: TaskWithWarnings[] = [];
    if (project?.autoSchedule) {
      affectedTasks = await this.tasksService.propagateSchedule(
        projectId,
        dto.predecessorTaskId,
        userId,
      );
    }

    return { dependency, affectedTasks };
  }

  async findAll(projectId: string): Promise<Dependency[]> {
    return this.prisma.dependency.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async delete(dependencyId: string, userId: string): Promise<void> {
    const dependency = await this.prisma.dependency.findUnique({
      where: { id: dependencyId },
    });

    if (!dependency) {
      throw new NotFoundException('Dependency not found');
    }

    await this.prisma.dependency.delete({
      where: { id: dependencyId },
    });

    await this.changeLogService.log({
      entityType: 'Dependency',
      entityId: dependencyId,
      userId,
      field: 'deleted',
      before: JSON.stringify({
        predecessor: dependency.predecessorTaskId,
        successor: dependency.successorTaskId,
      }),
      after: null,
    });
  }

  // Detect circular dependencies using DFS
  private async wouldCreateCycle(
    predecessorId: string,
    successorId: string,
    projectId: string,
  ): Promise<boolean> {
    // If adding predecessor -> successor, check if there's a path from successor to predecessor
    const visited = new Set<string>();
    const stack = [successorId];

    while (stack.length > 0) {
      const current = stack.pop()!;

      if (current === predecessorId) {
        return true; // Cycle detected
      }

      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      // Find all successors of current
      const deps = await this.prisma.dependency.findMany({
        where: {
          projectId,
          predecessorTaskId: current,
        },
        select: { successorTaskId: true },
      });

      for (const dep of deps) {
        if (!visited.has(dep.successorTaskId)) {
          stack.push(dep.successorTaskId);
        }
      }
    }

    return false;
  }
}
