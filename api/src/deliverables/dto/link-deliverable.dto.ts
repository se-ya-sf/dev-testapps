import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class LinkDeliverableDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  deliverableId: string;
}
