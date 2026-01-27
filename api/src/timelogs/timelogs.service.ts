import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimeLog } from '@prisma/client';
import { CreateTimeLogDto } from './dto/create-timelog.dto';

@Injectable()
export class TimeLogsService {
  constructor(private prisma: PrismaService) {}

  async create(taskId: string, dto: CreateTimeLogDto, userId: string): Promise<TimeLog> {
    // Verify task exists
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.deletedAt) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    return this.prisma.timeLog.create({
      data: {
        taskId,
        userId,
        workDate: new Date(dto.workDate),
        pd: dto.pd,
        note: dto.note,
      },
    });
  }

  async findByTask(
    taskId: string,
    from?: string,
    to?: string,
  ): Promise<TimeLog[]> {
    const where: any = { taskId };

    if (from || to) {
      where.workDate = {};
      if (from) where.workDate.gte = new Date(from);
      if (to) where.workDate.lte = new Date(to);
    }

    return this.prisma.timeLog.findMany({
      where,
      orderBy: { workDate: 'desc' },
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

  async getTaskActualPd(taskId: string): Promise<number> {
    const result = await this.prisma.timeLog.aggregate({
      where: { taskId },
      _sum: { pd: true },
    });
    return result._sum.pd || 0;
  }
}
