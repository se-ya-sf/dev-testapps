import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { TimeLogsService } from './timelogs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateTimeLogDto } from './dto/create-timelog.dto';
import { TimeLogResponseDto, TimeLogListResponseDto } from './dto/timelog-response.dto';

@ApiTags('TimeLogs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks/:taskId/time-logs')
export class TimeLogsController {
  constructor(private readonly timeLogsService: TimeLogsService) {}

  @Get()
  @ApiOperation({ summary: 'List time logs for a task' })
  @ApiQuery({ name: 'from', type: String, required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', type: String, required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'OK', type: TimeLogListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async listTimeLogs(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<TimeLogListResponseDto> {
    const logs = await this.timeLogsService.findByTask(taskId, from, to);
    return {
      items: logs.map((log) => this.toResponseDto(log)),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create time log (PD)' })
  @ApiResponse({ status: 201, description: 'Created', type: TimeLogResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async createTimeLog(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: CreateTimeLogDto,
    @CurrentUser('id') userId: string,
  ): Promise<TimeLogResponseDto> {
    const log = await this.timeLogsService.create(taskId, dto, userId);
    return this.toResponseDto(log);
  }

  private toResponseDto(log: any): TimeLogResponseDto {
    return {
      id: log.id,
      taskId: log.taskId,
      userId: log.userId,
      workDate: log.workDate.toISOString().split('T')[0],
      pd: log.pd,
      note: log.note,
    };
  }
}
