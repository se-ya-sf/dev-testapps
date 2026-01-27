import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseBoolPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import {
  TaskResponseDto,
  TaskListResponseDto,
  UpdateTaskResponseDto,
  MoveTaskResponseDto,
} from './dto/task-response.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('projects/:projectId/tasks')
  @UseGuards(RolesGuard)
  @Roles('Viewer')
  @ApiOperation({ summary: 'List tasks (flat; hierarchy via parentId)' })
  @ApiQuery({ name: 'includeDeleted', type: Boolean, required: false })
  @ApiResponse({ status: 200, description: 'OK', type: TaskListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async listTasks(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('includeDeleted', new DefaultValuePipe(false), ParseBoolPipe)
    includeDeleted: boolean,
  ): Promise<TaskListResponseDto> {
    const tasks = await this.tasksService.findAll(projectId, includeDeleted);
    return {
      items: tasks.map((t) => this.toResponseDto(t)),
    };
  }

  @Post('projects/:projectId/tasks')
  @UseGuards(RolesGuard)
  @Roles('Contributor')
  @ApiOperation({ summary: 'Create task' })
  @ApiResponse({ status: 201, description: 'Created', type: TaskResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async createTask(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser('id') userId: string,
  ): Promise<TaskResponseDto> {
    const task = await this.tasksService.create(projectId, dto, userId);
    return this.toResponseDto(task);
  }

  @Get('tasks/:taskId')
  @ApiOperation({ summary: 'Get task detail' })
  @ApiResponse({ status: 200, description: 'OK', type: TaskResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async getTask(
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ): Promise<TaskResponseDto> {
    const task = await this.tasksService.findOne(taskId);
    return this.toResponseDto(task);
  }

  @Patch('tasks/:taskId')
  @ApiOperation({ summary: 'Update task (partial); may return affected tasks when autoSchedule=ON' })
  @ApiResponse({ status: 200, description: 'OK', type: UpdateTaskResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async updateTask(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser('id') userId: string,
  ): Promise<UpdateTaskResponseDto> {
    const result = await this.tasksService.update(taskId, dto, userId);
    return {
      updatedTask: this.toResponseDto(result.updatedTask),
      affectedTasks: result.affectedTasks.map((t) => this.toResponseDto(t)),
    };
  }

  @Delete('tasks/:taskId')
  @ApiOperation({ summary: 'Delete task (logical delete)' })
  @ApiResponse({ status: 204, description: 'No Content' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async deleteTask(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.tasksService.delete(taskId, userId);
  }

  @Post('tasks/:taskId/move')
  @ApiOperation({ summary: 'Move task (change parent and/or order)' })
  @ApiResponse({ status: 200, description: 'OK', type: MoveTaskResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async moveTask(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: MoveTaskDto,
    @CurrentUser('id') userId: string,
  ): Promise<MoveTaskResponseDto> {
    const result = await this.tasksService.move(taskId, dto, userId);
    return result;
  }

  private toResponseDto(task: any): TaskResponseDto {
    return {
      id: task.id,
      projectId: task.projectId,
      parentId: task.parentId,
      orderIndex: task.orderIndex,
      type: task.type,
      title: task.title,
      description: task.description,
      startDate: task.startDate?.toISOString().split('T')[0] || null,
      endDate: task.endDate?.toISOString().split('T')[0] || null,
      progress: task.progress,
      status: task.status,
      priority: task.priority,
      estimatePd: task.estimatePd,
      actualPd: task.actualPd,
      assigneeIds: task.assignees?.map((a: any) => a.userId) || null,
      hasScheduleWarning: task.hasScheduleWarning || false,
      scheduleWarnings: task.scheduleWarnings || null,
      deletedAt: task.deletedAt?.toISOString() || null,
    };
  }
}
