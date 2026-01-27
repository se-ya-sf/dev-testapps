import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsUrl, ValidateNested } from 'class-validator';

export class EventFlagsDto {
  @ApiProperty()
  @IsBoolean()
  mention: boolean;

  @ApiProperty()
  @IsBoolean()
  overdue: boolean;

  @ApiProperty()
  @IsBoolean()
  baselineCreated: boolean;
}

export class UpsertTeamsSettingDto {
  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ format: 'uri', description: 'Required when enabled=true' })
  @IsOptional()
  @IsUrl()
  webhookUrl?: string;

  @ApiProperty({ type: EventFlagsDto })
  @ValidateNested()
  @Type(() => EventFlagsDto)
  eventFlags: EventFlagsDto;
}
