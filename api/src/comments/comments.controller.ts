import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentResponseDto, CommentListResponseDto } from './dto/comment-response.dto';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('tasks/:taskId/comments')
  @ApiOperation({ summary: 'List comments for a task' })
  @ApiResponse({ status: 200, description: 'OK', type: CommentListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async listComments(
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ): Promise<CommentListResponseDto> {
    const comments = await this.commentsService.findByTask(taskId);
    return {
      items: comments.map((c) => this.toResponseDto(c)),
    };
  }

  @Post('tasks/:taskId/comments')
  @ApiOperation({ summary: 'Create comment (supports @mention)' })
  @ApiResponse({ status: 201, description: 'Created', type: CommentResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async createComment(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser('id') userId: string,
  ): Promise<CommentResponseDto> {
    const comment = await this.commentsService.create(taskId, dto, userId);
    return this.toResponseDto(comment);
  }

  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete comment (logical)' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async deleteComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.commentsService.delete(commentId, userId);
  }

  private toResponseDto(comment: any): CommentResponseDto {
    return {
      id: comment.id,
      taskId: comment.taskId,
      userId: comment.userId,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      deletedAt: comment.deletedAt?.toISOString() || null,
    };
  }
}
