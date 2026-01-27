import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// String types for SQLite compatibility
const TaskTypeValues = ['task', 'summary', 'milestone'] as const;
type TaskType = typeof TaskTypeValues[number];

const TaskStatusValues = ['NotStarted', 'InProgress', 'Blocked', 'Done'] as const;
type TaskStatus = typeof TaskStatusValues[number];

export class TaskResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  projectId: string;

  @ApiPropertyOptional({ format: 'uuid' })
  parentId: string | null;

  @ApiProperty()
  orderIndex: number;

  @ApiProperty({ enum: TaskTypeValues })
  type: TaskType;

  @ApiProperty({ maxLength: 200 })
  title: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiPropertyOptional({ format: 'date' })
  startDate: string | null;

  @ApiPropertyOptional({ format: 'date' })
  endDate: string | null;

  @ApiProperty({ minimum: 0, maximum: 100 })
  progress: number;

  @ApiProperty({ enum: TaskStatusValues })
  status: TaskStatus;

  @ApiPropertyOptional()
  priority: string | null;

  @ApiPropertyOptional({ minimum: 0 })
  estimatePd: number | null;

  @ApiPropertyOptional({ minimum: 0, description: 'Aggregated from time logs' })
  actualPd: number | null;

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  assigneeIds: string[] | null;

  @ApiProperty({ default: false })
  hasScheduleWarning: boolean;

  @ApiPropertyOptional({ type: [String], enum: ['SCHEDULE_MISSING_DATES', 'SCHEDULE_VIOLATION'] })
  scheduleWarnings: string[] | null;

  @ApiPropertyOptional({ format: 'date-time' })
  deletedAt: string | null;
}

export class TaskListResponseDto {
  @ApiProperty({ type: [TaskResponseDto] })
  items: TaskResponseDto[];
}

export class UpdateTaskResponseDto {
  @ApiProperty({ type: TaskResponseDto })
  updatedTask: TaskResponseDto;

  @ApiProperty({ type: [TaskResponseDto] })
  affectedTasks: TaskResponseDto[];
}

export class MoveTaskResponseDto {
  @ApiProperty({ format: 'uuid' })
  movedTaskId: string;
}
