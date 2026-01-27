import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { MembersController } from './members.controller';
import { AuthModule } from '../auth/auth.module';
import { ChangeLogModule } from '../changelog/changelog.module';

@Module({
  imports: [AuthModule, ChangeLogModule],
  controllers: [ProjectsController, MembersController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
