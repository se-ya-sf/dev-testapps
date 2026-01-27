import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Comment } from '@prisma/client';
import { CreateCommentDto } from './dto/create-comment.dto';
import { TeamsService } from '../teams/teams.service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private teamsService: TeamsService,
  ) {}

  async create(taskId: string, dto: CreateCommentDto, userId: string): Promise<Comment> {
    // Verify task exists
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task || task.deletedAt) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    const comment = await this.prisma.comment.create({
      data: {
        taskId,
        userId,
        body: dto.body,
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

    // Extract mentions and send notifications
    const mentions = this.extractMentions(dto.body);
    if (mentions.length > 0) {
      await this.teamsService.sendMentionNotification(
        task.projectId,
        taskId,
        task.title,
        mentions,
        userId,
      );
    }

    return comment;
  }

  async findByTask(taskId: string): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: { taskId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
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

  async delete(commentId: string, userId: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.deletedAt) {
      throw new NotFoundException(`Comment ${commentId} not found`);
    }

    // Soft delete
    await this.prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });
  }

  // Extract @mentions from comment body
  private extractMentions(body: string): string[] {
    const mentionRegex = /@(\S+)/g;
    const matches = body.match(mentionRegex);
    if (!matches) return [];

    return matches.map((m) => m.slice(1)); // Remove @ prefix
  }
}
