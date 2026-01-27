import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

// String type for SQLite compatibility
type Role = 'Admin' | 'PM' | 'Manager' | 'Contributor' | 'Viewer';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const projectId = request.params.projectId || request.body?.projectId;

    if (!projectId) {
      // If no projectId, check if user is Admin
      const isAdmin = await this.authService.isAdmin(user.id);
      if (isAdmin) return true;
      throw new ForbiddenException('Project ID required for authorization');
    }

    const userRole = await this.authService.getUserProjectRole(user.id, projectId);

    if (!userRole) {
      throw new ForbiddenException('You are not a member of this project');
    }

    // Role hierarchy: Admin > PM > Manager > Contributor > Viewer
    const roleHierarchy: readonly string[] = ['Admin', 'PM', 'Manager', 'Contributor', 'Viewer'] as const;
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const hasPermission = requiredRoles.some(
      (role) => userRoleIndex <= roleHierarchy.indexOf(role),
    );

    if (!hasPermission) {
      throw new ForbiddenException(`Insufficient permissions. Required: ${requiredRoles.join(' or ')}`);
    }

    return true;
  }
}
