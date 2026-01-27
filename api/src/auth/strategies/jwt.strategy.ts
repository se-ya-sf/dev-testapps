import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'dev-secret-key',
      // For Entra ID, you would use JWKS
      // secretOrKeyProvider: async (request, rawJwtToken, done) => {
      //   // Fetch JWKS from Entra ID and validate
      // },
    });
  }

  async validate(payload: JwtPayload) {
    // Validate tenant ID for single-tenant restriction
    if (payload.tid && !this.authService.validateTenantId(payload.tid)) {
      throw new UnauthorizedException('Invalid tenant');
    }

    // Find or create user (JIT provisioning)
    const user = await this.authService.findOrCreateUser(
      payload.oid,
      payload.email,
      payload.name,
    );

    if (!user) {
      throw new UnauthorizedException('User validation failed');
    }

    return {
      id: user.id,
      entraOid: user.entraOid,
      email: user.email,
      displayName: user.displayName,
    };
  }
}
