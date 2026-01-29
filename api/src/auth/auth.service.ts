import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

// String type for SQLite compatibility
type Role = 'Admin' | 'PM' | 'Manager' | 'Contributor' | 'Viewer';

export interface JwtPayload {
  sub: string; // User ID (internal)
  oid: string; // Entra Object ID
  email: string;
  name: string;
  tid?: string; // Tenant ID
}

export interface UserWithRoles extends User {
  projects?: { projectId: string; role: string }[];
}

@Injectable()
export class AuthService {
  private readonly allowedTenantId: string | undefined;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.allowedTenantId = this.configService.get<string>('ENTRA_TENANT_ID');
  }

  // Validate tenant ID for single-tenant restriction
  validateTenantId(tid: string): boolean {
    if (!this.allowedTenantId) {
      // If not configured, allow all tenants (dev mode)
      return true;
    }
    return tid === this.allowedTenantId;
  }

  // Find or create user (JIT provisioning)
  async findOrCreateUser(
    entraOid: string,
    email: string,
    displayName: string,
  ): Promise<UserWithRoles> {
    // First try to find by entraOid
    let user = await this.prisma.user.findUnique({
      where: { entraOid },
      include: {
        projectMembers: {
          select: { projectId: true, role: true },
        },
      },
    });

    // If not found by entraOid, try to find by email (for dev mode compatibility)
    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          projectMembers: {
            select: { projectId: true, role: true },
          },
        },
      });
      
      if (user) {
        // Update entraOid if user exists with different oid
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { entraOid, displayName },
          include: {
            projectMembers: {
              select: { projectId: true, role: true },
            },
          },
        });
      }
    }

    if (!user) {
      // JIT provisioning - create user on first login
      user = await this.prisma.user.create({
        data: {
          entraOid,
          email,
          displayName,
        },
        include: {
          projectMembers: {
            select: { projectId: true, role: true },
          },
        },
      });
    } else if (user.email !== email || user.displayName !== displayName) {
      // Update user info if changed
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { email, displayName },
        include: {
          projectMembers: {
            select: { projectId: true, role: true },
          },
        },
      });
    }

    return {
      ...user,
      projects: user.projectMembers as { projectId: string; role: string }[],
    };
  }

  // Find user by ID
  async findUserById(id: string): Promise<UserWithRoles | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        projectMembers: {
          select: { projectId: true, role: true },
        },
      },
    });

    if (!user) return null;

    return {
      ...user,
      projects: user.projectMembers as { projectId: string; role: string }[],
    };
  }

  // Find user by Entra OID
  async findUserByEntraOid(entraOid: string): Promise<UserWithRoles | null> {
    const user = await this.prisma.user.findUnique({
      where: { entraOid },
      include: {
        projectMembers: {
          select: { projectId: true, role: true },
        },
      },
    });

    if (!user) return null;

    return {
      ...user,
      projects: user.projectMembers as { projectId: string; role: string }[],
    };
  }

  // Generate development JWT (for mock auth)
  async generateDevToken(userId: string): Promise<string> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload: JwtPayload = {
      sub: user.id,
      oid: user.entraOid,
      email: user.email,
      name: user.displayName,
    };

    return this.jwtService.sign(payload);
  }

  // Get user's role in a project
  async getUserProjectRole(userId: string, projectId: string): Promise<string | null> {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });
    return member?.role || null;
  }

  // Check if user has any Admin role
  async isAdmin(userId: string): Promise<boolean> {
    const adminMembership = await this.prisma.projectMember.findFirst({
      where: {
        userId,
        role: 'Admin',
      },
    });
    return !!adminMembership;
  }
}
