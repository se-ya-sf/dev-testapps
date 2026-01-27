import {
  Controller,
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
import { DeliverablesService } from './deliverables.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateDeliverableDto } from './dto/create-deliverable.dto';
import { LinkDeliverableDto } from './dto/link-deliverable.dto';
import { DeliverableResponseDto } from './dto/deliverable-response.dto';

@ApiTags('Deliverables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class DeliverablesController {
  constructor(private readonly deliverablesService: DeliverablesService) {}

  @Post('projects/:projectId/deliverables')
  @UseGuards(RolesGuard)
  @Roles('Contributor')
  @ApiOperation({ summary: 'Create deliverable (URL)' })
  @ApiResponse({ status: 201, description: 'Created', type: DeliverableResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async createDeliverable(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateDeliverableDto,
  ): Promise<DeliverableResponseDto> {
    const deliverable = await this.deliverablesService.create(projectId, dto);
    return {
      id: deliverable.id,
      projectId: deliverable.projectId,
      name: deliverable.name,
      url: deliverable.url,
      type: deliverable.type,
      note: deliverable.note,
    };
  }

  @Post('tasks/:taskId/deliverables/link')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Link deliverable to task' })
  @ApiResponse({ status: 204, description: 'Linked' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async linkDeliverable(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: LinkDeliverableDto,
  ): Promise<void> {
    await this.deliverablesService.linkToTask(taskId, dto.deliverableId);
  }

  @Delete('tasks/:taskId/deliverables/:deliverableId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlink deliverable from task' })
  @ApiResponse({ status: 204, description: 'Unlinked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async unlinkDeliverable(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('deliverableId', ParseUUIDPipe) deliverableId: string,
  ): Promise<void> {
    await this.deliverablesService.unlinkFromTask(taskId, deliverableId);
  }
}
