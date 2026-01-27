import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TimeLogResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  taskId: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ format: 'date' })
  workDate: string;

  @ApiProperty({ minimum: 0 })
  pd: number;

  @ApiPropertyOptional()
  note: string | null;
}

export class TimeLogListResponseDto {
  @ApiProperty({ type: [TimeLogResponseDto] })
  items: TimeLogResponseDto[];
}
