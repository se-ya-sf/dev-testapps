import { Module, Global } from '@nestjs/common';
import { ChangeLogService } from './changelog.service';
import { ChangeLogController } from './changelog.controller';

@Global()
@Module({
  controllers: [ChangeLogController],
  providers: [ChangeLogService],
  exports: [ChangeLogService],
})
export class ChangeLogModule {}
