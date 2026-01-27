import { Module, forwardRef } from '@nestjs/common';
import { DependenciesService } from './dependencies.service';
import { DependenciesController } from './dependencies.controller';
import { AuthModule } from '../auth/auth.module';
import { ChangeLogModule } from '../changelog/changelog.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    AuthModule, 
    ChangeLogModule,
    forwardRef(() => TasksModule),
  ],
  controllers: [DependenciesController],
  providers: [DependenciesService],
  exports: [DependenciesService],
})
export class DependenciesModule {}
