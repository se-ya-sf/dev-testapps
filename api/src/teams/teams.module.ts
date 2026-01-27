import { Module, Global } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { AuthModule } from '../auth/auth.module';
import { ChangeLogModule } from '../changelog/changelog.module';

@Global()
@Module({
  imports: [AuthModule, ChangeLogModule],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
