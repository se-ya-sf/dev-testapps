import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTimeLogDto {
  @ApiProperty({ format: 'date' })
  @IsDateString()
  workDate: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  pd: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
