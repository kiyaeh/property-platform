import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './config/env.validation';
import { PropertiesModule } from './properties/properties.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    PropertiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
