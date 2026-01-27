import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// String type for SQLite compatibility
const ProjectStatusValues = ['Planning', 'Active', 'OnHold', 'Done', 'Archived'] as const;
type ProjectStatus = typeof ProjectStatusValues[number];

export class ProjectResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ maxLength: 100 })
  name: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiPropertyOptional({ format: 'date' })
  startDate: string | null;

  @ApiPropertyOptional({ format: 'date' })
  endDate: string | null;

  @ApiProperty()
  timezone: string;

  @ApiProperty()
  autoSchedule: boolean;

  @ApiProperty({ enum: ProjectStatusValues })
  status: ProjectStatus;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

export class ProjectListResponseDto {
  @ApiProperty({ type: [ProjectResponseDto] })
  items: ProjectResponseDto[];
}
