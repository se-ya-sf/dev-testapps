import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BaselineResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  projectId: string;

  @ApiProperty({ maxLength: 100 })
  name: string;

  @ApiProperty()
  locked: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;
}

export class BaselineListResponseDto {
  @ApiProperty({ type: [BaselineResponseDto] })
  items: BaselineResponseDto[];
}

export class BaselineDiffItemDto {
  @ApiProperty({ format: 'uuid' })
  taskId: string;

  @ApiPropertyOptional({ format: 'date' })
  baselineStart: string | null;

  @ApiPropertyOptional({ format: 'date' })
  baselineEnd: string | null;

  @ApiPropertyOptional({ format: 'date' })
  currentStart: string | null;

  @ApiPropertyOptional({ format: 'date' })
  currentEnd: string | null;

  @ApiPropertyOptional({ description: 'Only when both baseline and current dates exist' })
  deltaDays: number | null;

  @ApiPropertyOptional()
  deltaPd: number | null;
}

export class BaselineDiffSummaryDto {
  @ApiProperty()
  slippedTasks: number;

  @ApiProperty()
  totalDeltaDays: number;

  @ApiProperty()
  deltaPd: number;
}

export class BaselineDiffResponseDto {
  @ApiProperty({ type: BaselineDiffSummaryDto })
  summary: BaselineDiffSummaryDto;

  @ApiProperty({ type: [BaselineDiffItemDto] })
  items: BaselineDiffItemDto[];
}
