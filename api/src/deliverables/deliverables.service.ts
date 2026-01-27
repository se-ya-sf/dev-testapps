import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Deliverable } from '@prisma/client';
import { CreateDeliverableDto } from './dto/create-deliverable.dto';

@Injectable()
export class DeliverablesService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, dto: CreateDeliverableDto): Promise<Deliverable> {
    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    return this.prisma.deliverable.create({
      data: {
        projectId,
        name: dto.name,
        url: dto.url,
        type: dto.type,
        note: dto.note,
      },
    });
  }

  async linkToTask(taskId: string, deliverableId: string): Promise<void> {
    // Verify task exists
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.deletedAt) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    // Verify deliverable exists
    const deliverable = await this.prisma.deliverable.findUnique({
      where: { id: deliverableId },
    });

    if (!deliverable) {
      throw new NotFoundException(`Deliverable ${deliverableId} not found`);
    }

    // Check if already linked
    const existing = await this.prisma.taskDeliverable.findUnique({
      where: {
        taskId_deliverableId: {
          taskId,
          deliverableId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Deliverable is already linked to this task');
    }

    await this.prisma.taskDeliverable.create({
      data: {
        taskId,
        deliverableId,
      },
    });
  }

  async unlinkFromTask(taskId: string, deliverableId: string): Promise<void> {
    const link = await this.prisma.taskDeliverable.findUnique({
      where: {
        taskId_deliverableId: {
          taskId,
          deliverableId,
        },
      },
    });

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    await this.prisma.taskDeliverable.delete({
      where: { id: link.id },
    });
  }

  async findByTask(taskId: string): Promise<Deliverable[]> {
    const links = await this.prisma.taskDeliverable.findMany({
      where: { taskId },
      include: { deliverable: true },
    });

    return links.map((l) => l.deliverable);
  }
}
