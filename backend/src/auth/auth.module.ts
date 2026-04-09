import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.getOrThrow<string>('JWT_SECRET', {
          infer: true,
        });
        const rawExpiresIn = configService.get<string>('JWT_EXPIRES_IN', {
          infer: true,
        });
        const expiresInSeconds = Number(rawExpiresIn);

        return {
          secret,
          signOptions: {
            expiresIn: Number.isFinite(expiresInSeconds)
              ? expiresInSeconds
              : 86_400,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
