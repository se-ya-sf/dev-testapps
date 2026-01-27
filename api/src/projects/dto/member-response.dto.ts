import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// String type for SQLite compatibility
const RoleValues = ['Admin', 'PM', 'Manager', 'Contributor', 'Viewer'] as const;
type Role = typeof RoleValues[number];

export class MemberUserDto {
  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty()
  displayName: string;
}

export class ProjectMemberResponseDto {
  @ApiProperty({ format: 'uuid' })
  projectId: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ enum: RoleValues })
  role: Role;

  @ApiPropertyOptional({ type: MemberUserDto })
  user: MemberUserDto | null;
}

export class ProjectMemberListResponseDto {
  @ApiProperty({ type: [ProjectMemberResponseDto] })
  items: ProjectMemberResponseDto[];
}
