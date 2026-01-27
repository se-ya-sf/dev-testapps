import { SetMetadata } from '@nestjs/common';

// String type for SQLite compatibility
type Role = 'Admin' | 'PM' | 'Manager' | 'Contributor' | 'Viewer';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
