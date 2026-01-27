import { ApiProperty } from '@nestjs/swagger';

// String type for SQLite compatibility
const RoleValues = ['Admin', 'PM', 'Manager', 'Contributor', 'Viewer'] as const;
type Role = typeof RoleValues[number];

export class ProjectRoleDto {
  @ApiProperty({ format: 'uuid' })
  projectId: string;

  @ApiProperty({ enum: RoleValues })
  role: Role;
}

export class MeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  entraOid: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty({ type: [ProjectRoleDto] })
  projects: ProjectRoleDto[];
}
