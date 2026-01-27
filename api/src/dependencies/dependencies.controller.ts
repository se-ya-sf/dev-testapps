import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { DependenciesService } from './dependencies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateDependencyDto } from './dto/create-dependency.dto';
import {
  DependencyResponseDto,
  DependencyListResponseDto,
  CreateDependencyResponseDto,
} from './dto/dependency-response.dto';

@ApiTags('Dependencies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class DependenciesController {
  constructor(private readonly dependenciesService: DependenciesService) {}

  @Get('projects/:projectId/dependencies')
  @UseGuards(RolesGuard)
  @Roles('Viewer')
  @ApiOperation({ summary: 'List dependencies in a project' })
  @ApiResponse({ status: 200, description: 'OK', type: DependencyListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async listDependencies(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<DependencyListResponseDto> {
    const deps = await this.dependenciesService.findAll(projectId);
    return {
      items: deps.map((d) => this.toResponseDto(d)),
    };
  }

  @Post('projects/:projectId/dependencies')
  @UseGuards(RolesGuard)
  @Roles('Manager')
  @ApiOperation({ summary: 'Create dependency (FS only in MVP); rejects cycles' })
  @ApiResponse({ status: 201, description: 'Created', type: CreateDependencyResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request (cycle detected or duplicate)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async createDependency(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateDependencyDto,
    @CurrentUser('id') userId: string,
  ): Promise<CreateDependencyResponseDto> {
    const result = await this.dependenciesService.create(projectId, dto, userId);
    return {
      dependency: this.toResponseDto(result.dependency),
      affectedTasks: result.affectedTasks.map((t) => ({
        id: t.id,
        projectId: t.projectId,
        parentId: t.parentId,
        orderIndex: t.orderIndex,
        type: t.type as 'task' | 'summary' | 'milestone',
        title: t.title,
        description: t.description,
        startDate: t.startDate?.toISOString().split('T')[0] || null,
        endDate: t.endDate?.toISOString().split('T')[0] || null,
        progress: t.progress,
        status: t.status as 'NotStarted' | 'InProgress' | 'Blocked' | 'Done',
        priority: t.priority,
        estimatePd: t.estimatePd,
        actualPd: t.actualPd,
        assigneeIds: null,
        hasScheduleWarning: t.hasScheduleWarning,
        scheduleWarnings: t.scheduleWarnings,
        deletedAt: t.deletedAt?.toISOString() || null,
      })),
    };
  }

  @Delete('dependencies/:dependencyId')
  @ApiOperation({ summary: 'Delete dependency' })
  @ApiResponse({ status: 204, description: 'No Content' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async deleteDependency(
    @Param('dependencyId', ParseUUIDPipe) dependencyId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.dependenciesService.delete(dependencyId, userId);
  }

  private toResponseDto(dep: any): DependencyResponseDto {
    return {
      id: dep.id,
      projectId: dep.projectId,
      predecessorTaskId: dep.predecessorTaskId,
      successorTaskId: dep.successorTaskId,
      type: dep.type,
      lagDays: dep.lagDays,
    };
  }
}
