import { Controller, Get, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ChangeLogService } from './changelog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChangeLogListResponseDto, ChangeLogResponseDto } from './dto/changelog-response.dto';

@ApiTags('History')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ChangeLogController {
  constructor(private readonly changeLogService: ChangeLogService) {}

  @Get('tasks/:taskId/history')
  @ApiOperation({ summary: 'List change history for a task' })
  @ApiResponse({ status: 200, description: 'OK', type: ChangeLogListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async listTaskHistory(
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ): Promise<ChangeLogListResponseDto> {
    const logs = await this.changeLogService.findByTask(taskId);
    return {
      items: logs.map((log) => this.toResponseDto(log)),
    };
  }

  private toResponseDto(log: any): ChangeLogResponseDto {
    return {
      id: log.id,
      entityType: log.entityType,
      entityId: log.entityId,
      userId: log.userId,
      field: log.field,
      before: log.before,
      after: log.after,
      createdAt: log.createdAt.toISOString(),
    };
  }
}
