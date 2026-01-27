import { Module } from '@nestjs/common';
import { BaselinesService } from './baselines.service';
import { BaselinesController } from './baselines.controller';
import { AuthModule } from '../auth/auth.module';
import { ChangeLogModule } from '../changelog/changelog.module';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [AuthModule, ChangeLogModule, TeamsModule],
  controllers: [BaselinesController],
  providers: [BaselinesService],
  exports: [BaselinesService],
})
export class BaselinesModule {}
