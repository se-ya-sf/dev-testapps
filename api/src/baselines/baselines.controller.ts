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
import { BaselinesService } from './baselines.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateBaselineDto } from './dto/create-baseline.dto';
import {
  BaselineResponseDto,
  BaselineListResponseDto,
  BaselineDiffResponseDto,
} from './dto/baseline-response.dto';

@ApiTags('Baselines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class BaselinesController {
  constructor(private readonly baselinesService: BaselinesService) {}

  @Get('projects/:projectId/baselines')
  @UseGuards(RolesGuard)
  @Roles('Viewer')
  @ApiOperation({ summary: 'List baselines' })
  @ApiResponse({ status: 200, description: 'OK', type: BaselineListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async listBaselines(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<BaselineListResponseDto> {
    const baselines = await this.baselinesService.findAll(projectId);
    return {
      items: baselines.map((b) => ({
        id: b.id,
        projectId: b.projectId,
        name: b.name,
        locked: b.locked,
        createdAt: b.createdAt.toISOString(),
      })),
    };
  }

  @Post('projects/:projectId/baselines')
  @UseGuards(RolesGuard)
  @Roles('Manager')
  @ApiOperation({ summary: 'Create baseline snapshot' })
  @ApiResponse({ status: 201, description: 'Created', type: BaselineResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async createBaseline(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateBaselineDto,
    @CurrentUser('id') userId: string,
  ): Promise<BaselineResponseDto> {
    const baseline = await this.baselinesService.create(projectId, dto, userId);
    return {
      id: baseline.id,
      projectId: baseline.projectId,
      name: baseline.name,
      locked: baseline.locked,
      createdAt: baseline.createdAt.toISOString(),
    };
  }

  @Get('baselines/:baselineId/diff')
  @ApiOperation({ summary: 'Get diff between baseline and current' })
  @ApiQuery({ name: 'compare', enum: ['current'], required: true })
  @ApiResponse({ status: 200, description: 'OK', type: BaselineDiffResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async getBaselineDiff(
    @Param('baselineId', ParseUUIDPipe) baselineId: string,
    @Query('compare') compare: string,
  ): Promise<BaselineDiffResponseDto> {
    const diff = await this.baselinesService.getDiff(baselineId);
    return diff;
  }
}
