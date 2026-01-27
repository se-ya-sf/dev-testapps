import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MeResponseDto } from './dto/me-response.dto';
import { DevLoginDto } from './dto/dev-login.dto';

@ApiTags('Auth')
@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile and project roles' })
  @ApiResponse({ status: 200, description: 'OK', type: MeResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@Request() req: any): Promise<MeResponseDto> {
    const user = await this.authService.findUserById(req.user.id);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      entraOid: user.entraOid,
      email: user.email,
      displayName: user.displayName,
      projects: (user.projects || []).map((p) => ({
        projectId: p.projectId,
        role: p.role as 'Admin' | 'PM' | 'Manager' | 'Contributor' | 'Viewer',
      })),
    };
  }

  // Development-only endpoint for mock authentication
  @Post('auth/dev-login')
  @ApiOperation({ summary: '[DEV ONLY] Login with mock user' })
  @ApiResponse({ status: 200, description: 'Returns JWT token' })
  async devLogin(@Body() dto: DevLoginDto): Promise<{ token: string }> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('This endpoint is only available in development');
    }

    // Create or find mock user
    const user = await this.authService.findOrCreateUser(
      dto.entraOid || `mock-${dto.email}`,
      dto.email,
      dto.displayName || dto.email.split('@')[0],
    );

    const token = await this.authService.generateDevToken(user.id);
    return { token };
  }
}
