import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength, IsDateString, IsIn } from 'class-validator';

// String type for SQLite compatibility
const ProjectStatusValues = ['Planning', 'Active', 'OnHold', 'Done', 'Archived'] as const;
type ProjectStatus = typeof ProjectStatusValues[number];

export class UpdateProjectDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoSchedule?: boolean;

  @ApiPropertyOptional({ enum: ProjectStatusValues })
  @IsOptional()
  @IsString()
  @IsIn(ProjectStatusValues)
  status?: ProjectStatus;
}
