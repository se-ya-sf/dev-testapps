import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { DependenciesModule } from './dependencies/dependencies.module';
import { BaselinesModule } from './baselines/baselines.module';
import { TimeLogsModule } from './timelogs/timelogs.module';
import { CommentsModule } from './comments/comments.module';
import { DeliverablesModule } from './deliverables/deliverables.module';
import { TeamsModule } from './teams/teams.module';
import { ExportModule } from './export/export.module';
import { ChangeLogModule } from './changelog/changelog.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    TasksModule,
    DependenciesModule,
    BaselinesModule,
    TimeLogsModule,
    CommentsModule,
    DeliverablesModule,
    TeamsModule,
    ExportModule,
    ChangeLogModule,
  ],
})
export class AppModule {}
