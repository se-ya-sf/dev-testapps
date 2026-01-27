import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  taskId: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty()
  body: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiPropertyOptional({ format: 'date-time' })
  deletedAt: string | null;
}

export class CommentListResponseDto {
  @ApiProperty({ type: [CommentResponseDto] })
  items: CommentResponseDto[];
}
