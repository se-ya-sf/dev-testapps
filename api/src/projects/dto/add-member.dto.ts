import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString } from 'class-validator';

// String type for SQLite compatibility
const RoleValues = ['Admin', 'PM', 'Manager', 'Contributor', 'Viewer'] as const;
type Role = typeof RoleValues[number];

export class AddProjectMemberDto {
  @ApiProperty({ format: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: RoleValues })
  @IsString()
  @IsIn(RoleValues)
  role: Role;
}
