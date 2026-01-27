import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

// String type for SQLite compatibility
const DependencyTypeValues = ['FS'] as const;
type DependencyType = typeof DependencyTypeValues[number];

export class CreateDependencyDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  predecessorTaskId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  successorTaskId: string;

  @ApiPropertyOptional({ enum: DependencyTypeValues, default: 'FS' })
  @IsOptional()
  @IsString()
  @IsIn(DependencyTypeValues)
  type?: DependencyType;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  lagDays?: number;
}
