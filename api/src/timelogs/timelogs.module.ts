import { Module } from '@nestjs/common';
import { TimeLogsService } from './timelogs.service';
import { TimeLogsController } from './timelogs.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TimeLogsController],
  providers: [TimeLogsService],
  exports: [TimeLogsService],
})
export class TimeLogsModule {}
