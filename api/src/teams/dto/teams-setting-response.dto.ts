import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EventFlagsResponseDto {
  @ApiProperty()
  mention: boolean;

  @ApiProperty()
  overdue: boolean;

  @ApiProperty()
  baselineCreated: boolean;
}

export class TeamsSettingResponseDto {
  @ApiProperty()
  enabled: boolean;

  @ApiProperty({ type: EventFlagsResponseDto })
  eventFlags: EventFlagsResponseDto;

  @ApiPropertyOptional({ description: 'e.g., https://outlook.office.com/webhook/***last-6' })
  webhookMasked: string | null;
}
