import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeliverableResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  projectId: string;

  @ApiProperty({ maxLength: 200 })
  name: string;

  @ApiProperty({ format: 'uri' })
  url: string;

  @ApiPropertyOptional()
  type: string | null;

  @ApiPropertyOptional()
  note: string | null;
}
