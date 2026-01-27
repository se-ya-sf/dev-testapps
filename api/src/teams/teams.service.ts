import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TeamsSetting } from '@prisma/client';
import { UpsertTeamsSettingDto } from './dto/upsert-teams-setting.dto';
import { ChangeLogService } from '../changelog/changelog.service';

@Injectable()
export class TeamsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private changeLogService: ChangeLogService,
  ) {}

  async upsert(
    projectId: string,
    dto: UpsertTeamsSettingDto,
    userId: string,
  ): Promise<TeamsSetting> {
    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const existing = await this.prisma.teamsSetting.findUnique({
      where: { projectId },
    });

    // In production, encrypt the webhook URL or store in Key Vault
    // For MVP, we'll store it with basic masking in responses
    const encryptedUrl = dto.webhookUrl || null;

    const setting = await this.prisma.teamsSetting.upsert({
      where: { projectId },
      update: {
        enabled: dto.enabled,
        webhookUrlEncrypted: encryptedUrl,
        eventMention: dto.eventFlags.mention,
        eventOverdue: dto.eventFlags.overdue,
        eventBaselineCreated: dto.eventFlags.baselineCreated,
      },
      create: {
        projectId,
        enabled: dto.enabled,
        webhookUrlEncrypted: encryptedUrl,
        eventMention: dto.eventFlags.mention,
        eventOverdue: dto.eventFlags.overdue,
        eventBaselineCreated: dto.eventFlags.baselineCreated,
      },
    });

    await this.changeLogService.log({
      entityType: 'TeamsSetting',
      entityId: setting.id,
      userId,
      field: existing ? 'updated' : 'created',
      before: existing ? JSON.stringify({ enabled: existing.enabled }) : null,
      after: JSON.stringify({ enabled: dto.enabled }),
    });

    return setting;
  }

  async getSetting(projectId: string): Promise<TeamsSetting | null> {
    return this.prisma.teamsSetting.findUnique({
      where: { projectId },
    });
  }

  async testWebhook(projectId: string, message?: string): Promise<void> {
    const setting = await this.getSetting(projectId);
    if (!setting?.enabled || !setting.webhookUrlEncrypted) {
      throw new NotFoundException('Teams webhook not configured');
    }

    const testMessage = message || 'Test message from WBS Progress Management App';
    await this.sendToWebhook(setting.webhookUrlEncrypted, {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      summary: 'Test Notification',
      themeColor: '0076D7',
      title: '🧪 Test Notification',
      text: testMessage,
    });
  }

  // Send mention notification
  async sendMentionNotification(
    projectId: string,
    taskId: string,
    taskTitle: string,
    mentions: string[],
    fromUserId: string,
  ): Promise<void> {
    const setting = await this.getSetting(projectId);
    if (!setting?.enabled || !setting.eventMention || !setting.webhookUrlEncrypted) {
      return;
    }

    const fromUser = await this.prisma.user.findUnique({
      where: { id: fromUserId },
    });

    const card = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      summary: 'New Mention',
      themeColor: '0076D7',
      title: `📢 New Mention in Task: ${taskTitle}`,
      text: `${fromUser?.displayName || 'Someone'} mentioned: ${mentions.join(', ')}`,
      sections: [
        {
          facts: [
            { name: 'Task', value: taskTitle },
            { name: 'Mentioned', value: mentions.join(', ') },
          ],
        },
      ],
    };

    await this.sendToWebhookWithRetry(setting.webhookUrlEncrypted, card, projectId, 'mention');
  }

  // Send baseline created notification
  async sendBaselineCreatedNotification(
    projectId: string,
    baselineName: string,
    userId: string,
  ): Promise<void> {
    const setting = await this.getSetting(projectId);
    if (!setting?.enabled || !setting.eventBaselineCreated || !setting.webhookUrlEncrypted) {
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    const card = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      summary: 'Baseline Created',
      themeColor: '00FF00',
      title: `📊 Baseline Created: ${baselineName}`,
      text: `${user?.displayName || 'Someone'} created a new baseline for project "${project?.name}"`,
    };

    await this.sendToWebhookWithRetry(setting.webhookUrlEncrypted, card, projectId, 'baselineCreated');
  }

  // Send overdue notification
  async sendOverdueNotification(
    projectId: string,
    overdueTasks: { id: string; title: string; endDate: Date }[],
  ): Promise<void> {
    const setting = await this.getSetting(projectId);
    if (!setting?.enabled || !setting.eventOverdue || !setting.webhookUrlEncrypted) {
      return;
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    const taskList = overdueTasks
      .map((t) => `- ${t.title} (Due: ${t.endDate.toISOString().split('T')[0]})`)
      .join('\n');

    const card = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      summary: 'Overdue Tasks',
      themeColor: 'FF0000',
      title: `⚠️ Overdue Tasks in ${project?.name}`,
      text: `The following tasks are overdue:\n${taskList}`,
      sections: [
        {
          facts: overdueTasks.slice(0, 5).map((t) => ({
            name: t.title,
            value: `Due: ${t.endDate.toISOString().split('T')[0]}`,
          })),
        },
      ],
    };

    await this.sendToWebhookWithRetry(setting.webhookUrlEncrypted, card, projectId, 'overdue');
  }

  // Send to webhook with retry
  private async sendToWebhookWithRetry(
    webhookUrl: string,
    payload: any,
    projectId: string,
    eventType: string,
    maxRetries: number = 3,
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.sendToWebhook(webhookUrl, payload);
        
        // Log success
        await this.prisma.integrationLog.create({
          data: {
            integrationType: 'Teams',
            projectId,
            eventType,
            status: 'success',
            payload: JSON.stringify(payload),
          },
        });
        return;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    // Log failure after all retries
    await this.prisma.integrationLog.create({
      data: {
        integrationType: 'Teams',
        projectId,
        eventType,
        status: 'failed',
        payload: JSON.stringify(payload),
        errorMessage: lastError?.message,
        retryCount: maxRetries,
      },
    });
  }

  // Send to webhook (basic implementation)
  private async sendToWebhook(webhookUrl: string, payload: any): Promise<void> {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Teams webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  // Mask webhook URL for response
  maskWebhookUrl(url: string | null): string | null {
    if (!url) return null;
    const lastPart = url.slice(-6);
    return `https://outlook.office.com/webhook/***${lastPart}`;
  }
}
