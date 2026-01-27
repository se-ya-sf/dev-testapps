import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MockJwtStrategy } from './strategies/mock-jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'dev-secret-key',
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: 'JWT_STRATEGY',
      useFactory: (configService: ConfigService, authService: AuthService) => {
        const useMock = configService.get<string>('AUTH_MODE') === 'mock';
        if (useMock) {
          return new MockJwtStrategy(authService);
        }
        return new JwtStrategy(configService, authService);
      },
      inject: [ConfigService, AuthService],
    },
    JwtStrategy,
    MockJwtStrategy,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
