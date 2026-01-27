import {
  Controller,
  Get,
  Post,
  Patch,
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
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AddProjectMemberDto } from './dto/add-member.dto';
import { UpdateProjectMemberDto } from './dto/update-member.dto';
import { ProjectMemberResponseDto, ProjectMemberListResponseDto } from './dto/member-response.dto';

@ApiTags('Members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/members')
export class MembersController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @Roles('Viewer')
  @ApiOperation({ summary: 'List project members' })
  @ApiResponse({ status: 200, description: 'OK', type: ProjectMemberListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async getMembers(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<ProjectMemberListResponseDto> {
    const members = await this.projectsService.getMembers(projectId);
    return {
      items: members.map((m) => this.toResponseDto(m)),
    };
  }

  @Post()
  @Roles('PM')
  @ApiOperation({ summary: 'Add project member by email' })
  @ApiResponse({ status: 201, description: 'Added', type: ProjectMemberResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async addMember(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: AddProjectMemberDto,
    @CurrentUser('id') userId: string,
  ): Promise<ProjectMemberResponseDto> {
    const member = await this.projectsService.addMember(
      projectId,
      dto.email,
      dto.role,
      userId,
    );
    return this.toResponseDto(member);
  }

  @Patch(':userId')
  @Roles('PM')
  @ApiOperation({ summary: 'Update member role' })
  @ApiResponse({ status: 200, description: 'OK', type: ProjectMemberResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async updateMemberRole(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('userId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateProjectMemberDto,
    @CurrentUser('id') actorUserId: string,
  ): Promise<ProjectMemberResponseDto> {
    const member = await this.projectsService.updateMemberRole(
      projectId,
      memberId,
      dto.role,
      actorUserId,
    );
    return this.toResponseDto(member);
  }

  private toResponseDto(member: any): ProjectMemberResponseDto {
    return {
      projectId: member.projectId,
      userId: member.userId,
      role: member.role,
      user: member.user
        ? {
            email: member.user.email,
            displayName: member.user.displayName,
          }
        : null,
    };
  }
}
