import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangeLogResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: ['Project', 'Task', 'Dependency', 'ProjectMember', 'TeamsSetting', 'Baseline'] })
  entityType: string;

  @ApiProperty({ format: 'uuid' })
  entityId: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty()
  field: string;

  @ApiPropertyOptional()
  before: string | null;

  @ApiPropertyOptional()
  after: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;
}

export class ChangeLogListResponseDto {
  @ApiProperty({ type: [ChangeLogResponseDto] })
  items: ChangeLogResponseDto[];
}
