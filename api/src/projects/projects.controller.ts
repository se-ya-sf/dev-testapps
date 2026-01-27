import {
  Controller,
  Get,
  Post,
  Patch,
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
// ProjectStatus is now a string type for SQLite compatibility
const ProjectStatusValues = ['Planning', 'Active', 'OnHold', 'Done', 'Archived'] as const;
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto, ProjectListResponseDto } from './dto/project-response.dto';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create project' })
  @ApiResponse({ status: 201, description: 'Created', type: ProjectResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() dto: CreateProjectDto,
    @CurrentUser('id') userId: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsService.create(dto, userId);
    return this.toResponseDto(project);
  }

  @Get()
  @ApiOperation({ summary: 'List projects' })
  @ApiQuery({ name: 'status', enum: ProjectStatusValues, required: false })
  @ApiQuery({ name: 'q', type: String, required: false })
  @ApiResponse({ status: 200, description: 'OK', type: ProjectListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
  ): Promise<ProjectListResponseDto> {
    const projects = await this.projectsService.findAll(userId, { status, q });
    return {
      items: projects.map((p) => this.toResponseDto(p)),
    };
  }

  @Get(':projectId')
  @UseGuards(RolesGuard)
  @Roles('Viewer')
  @ApiOperation({ summary: 'Get project detail' })
  @ApiResponse({ status: 200, description: 'OK', type: ProjectResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async findOne(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsService.findOne(projectId);
    return this.toResponseDto(project);
  }

  @Patch(':projectId')
  @UseGuards(RolesGuard)
  @Roles('PM')
  @ApiOperation({ summary: 'Update project (partial)' })
  @ApiResponse({ status: 200, description: 'OK', type: ProjectResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async update(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser('id') userId: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsService.update(projectId, dto, userId);
    return this.toResponseDto(project);
  }

  private toResponseDto(project: any): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      startDate: project.startDate?.toISOString().split('T')[0] || null,
      endDate: project.endDate?.toISOString().split('T')[0] || null,
      timezone: project.timezone,
      autoSchedule: project.autoSchedule,
      status: project.status,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}
