import { ApiProperty } from '@nestjs/swagger';
import { TaskResponseDto } from '../../tasks/dto/task-response.dto';

// String type for SQLite compatibility
const DependencyTypeValues = ['FS'] as const;
type DependencyType = typeof DependencyTypeValues[number];

export class DependencyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  projectId: string;

  @ApiProperty({ format: 'uuid' })
  predecessorTaskId: string;

  @ApiProperty({ format: 'uuid' })
  successorTaskId: string;

  @ApiProperty({ enum: DependencyTypeValues })
  type: DependencyType;

  @ApiProperty()
  lagDays: number;
}

export class DependencyListResponseDto {
  @ApiProperty({ type: [DependencyResponseDto] })
  items: DependencyResponseDto[];
}

export class CreateDependencyResponseDto {
  @ApiProperty({ type: DependencyResponseDto })
  dependency: DependencyResponseDto;

  @ApiProperty({ type: [TaskResponseDto] })
  affectedTasks: TaskResponseDto[];
}
