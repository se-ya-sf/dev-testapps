import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  IsNumber,
  IsUUID,
  IsArray,
  MaxLength,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

// String types for SQLite compatibility
const TaskTypeValues = ['task', 'summary', 'milestone'] as const;
type TaskType = typeof TaskTypeValues[number];

const TaskStatusValues = ['NotStarted', 'InProgress', 'Blocked', 'Done'] as const;
type TaskStatus = typeof TaskStatusValues[number];

export class CreateTaskDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ enum: TaskTypeValues })
  @IsString()
  @IsIn(TaskTypeValues)
  type: TaskType;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @ApiPropertyOptional({ enum: TaskStatusValues })
  @IsOptional()
  @IsString()
  @IsIn(TaskStatusValues)
  status?: TaskStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatePd?: number;

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assigneeIds?: string[];
}
