import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeLog } from '@prisma/client';

export interface LogChangeInput {
  entityType: string;
  entityId: string;
  userId: string;
  field: string;
  before: string | null;
  after: string | null;
}

@Injectable()
export class ChangeLogService {
  constructor(private prisma: PrismaService) {}

  async log(input: LogChangeInput): Promise<ChangeLog> {
    return this.prisma.changeLog.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        userId: input.userId,
        field: input.field,
        before: input.before,
        after: input.after,
      },
    });
  }

  async findByEntity(entityType: string, entityId: string): Promise<ChangeLog[]> {
    return this.prisma.changeLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
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

  async findByTask(taskId: string): Promise<ChangeLog[]> {
    return this.findByEntity('Task', taskId);
  }
}
