import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

// String type for SQLite compatibility
const RoleValues = ['Admin', 'PM', 'Manager', 'Contributor', 'Viewer'] as const;
type Role = typeof RoleValues[number];

export class UpdateProjectMemberDto {
  @ApiProperty({ enum: RoleValues })
  @IsString()
  @IsIn(RoleValues)
  role: Role;
}
