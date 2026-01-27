import {
  Controller,
  Put,
  Post,
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
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpsertTeamsSettingDto } from './dto/upsert-teams-setting.dto';
import { TestTeamsSettingDto } from './dto/test-teams-setting.dto';
import { TeamsSettingResponseDto } from './dto/teams-setting-response.dto';

@ApiTags('Teams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/teams-setting')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Put()
  @Roles('PM')
  @ApiOperation({ summary: 'Upsert Teams Incoming Webhook settings for a project' })
  @ApiResponse({ status: 200, description: 'OK', type: TeamsSettingResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async upsertTeamsSetting(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: UpsertTeamsSettingDto,
    @CurrentUser('id') userId: string,
  ): Promise<TeamsSettingResponseDto> {
    const setting = await this.teamsService.upsert(projectId, dto, userId);
    return {
      enabled: setting.enabled,
      eventFlags: {
        mention: setting.eventMention,
        overdue: setting.eventOverdue,
        baselineCreated: setting.eventBaselineCreated,
      },
      webhookMasked: this.teamsService.maskWebhookUrl(setting.webhookUrlEncrypted),
    };
  }

  @Post('test')
  @Roles('PM')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Send test message to Teams webhook' })
  @ApiResponse({ status: 204, description: 'Sent' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async testTeamsSetting(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto?: TestTeamsSettingDto,
  ): Promise<void> {
    await this.teamsService.testWebhook(projectId, dto?.message);
  }
}
