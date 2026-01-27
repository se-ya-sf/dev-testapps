import { Module, forwardRef } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { AuthModule } from '../auth/auth.module';
import { ChangeLogModule } from '../changelog/changelog.module';
import { DependenciesModule } from '../dependencies/dependencies.module';

@Module({
  imports: [
    AuthModule, 
    ChangeLogModule,
    forwardRef(() => DependenciesModule),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
