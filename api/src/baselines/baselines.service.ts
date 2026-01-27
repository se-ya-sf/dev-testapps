import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Baseline } from '@prisma/client';
import { CreateBaselineDto } from './dto/create-baseline.dto';
import { ChangeLogService } from '../changelog/changelog.service';
import { TeamsService } from '../teams/teams.service';

export interface BaselineDiffItem {
  taskId: string;
  taskTitle: string;
  baselineStart: string | null;
  baselineEnd: string | null;
  currentStart: string | null;
  currentEnd: string | null;
  deltaDays: number | null;
  deltaPd: number | null;
}

export interface BaselineDiffSummary {
  slippedTasks: number;
  totalDeltaDays: number;
  deltaPd: number;
}

@Injectable()
export class BaselinesService {
  constructor(
    private prisma: PrismaService,
    private changeLogService: ChangeLogService,
    private teamsService: TeamsService,
  ) {}

  async create(projectId: string, dto: CreateBaselineDto, userId: string): Promise<Baseline> {
    // Get all active tasks for the project
    const tasks = await this.prisma.task.findMany({
      where: { projectId, deletedAt: null },
    });

    const baseline = await this.prisma.baseline.create({
      data: {
        projectId,
        name: dto.name,
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

    await this.changeLogService.log({
      entityType: 'Baseline',
      entityId: baseline.id,
      userId,
      field: 'created',
      before: null,
      after: JSON.stringify({ name: baseline.name, taskCount: tasks.length }),
    });

    // Send Teams notification
    await this.teamsService.sendBaselineCreatedNotification(projectId, baseline.name, userId);

    return baseline;
  }

  async findAll(projectId: string): Promise<Baseline[]> {
    return this.prisma.baseline.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(baselineId: string): Promise<Baseline> {
    const baseline = await this.prisma.baseline.findUnique({
      where: { id: baselineId },
    });

    if (!baseline) {
      throw new NotFoundException(`Baseline ${baselineId} not found`);
    }

    return baseline;
  }

  async getDiff(baselineId: string): Promise<{ summary: BaselineDiffSummary; items: BaselineDiffItem[] }> {
    const baseline = await this.findOne(baselineId);

    // Get baseline tasks
    const baselineTasks = await this.prisma.baselineTask.findMany({
      where: { baselineId },
      include: { task: true },
    });

    // Get current tasks
    const currentTasks = await this.prisma.task.findMany({
      where: { projectId: baseline.projectId, deletedAt: null },
    });

    const currentTaskMap = new Map(currentTasks.map((t) => [t.id, t]));

    const items: BaselineDiffItem[] = [];
    let slippedTasks = 0;
    let totalDeltaDays = 0;
    let totalDeltaPd = 0;

    for (const bt of baselineTasks) {
      const current = currentTaskMap.get(bt.taskId);
      if (!current) continue;

      const baselineStart = bt.startDate?.toISOString().split('T')[0] || null;
      const baselineEnd = bt.endDate?.toISOString().split('T')[0] || null;
      const currentStart = current.startDate?.toISOString().split('T')[0] || null;
      const currentEnd = current.endDate?.toISOString().split('T')[0] || null;

      // Calculate deltaDays for endDate
      let deltaDays: number | null = null;
      if (bt.endDate && current.endDate) {
        deltaDays = Math.round(
          (current.endDate.getTime() - bt.endDate.getTime()) / (24 * 60 * 60 * 1000),
        );
        if (deltaDays > 0) {
          slippedTasks++;
          totalDeltaDays += deltaDays;
        }
      }

      // Calculate deltaPd
      let deltaPd: number | null = null;
      if (bt.estimatePd !== null && current.estimatePd !== null) {
        deltaPd = current.estimatePd - bt.estimatePd;
        totalDeltaPd += deltaPd;
      }

      items.push({
        taskId: bt.taskId,
        taskTitle: current.title,
        baselineStart,
        baselineEnd,
        currentStart,
        currentEnd,
        deltaDays,
        deltaPd,
      });
    }

    return {
      summary: {
        slippedTasks,
        totalDeltaDays,
        deltaPd: totalDeltaPd,
      },
      items,
    };
  }
}
