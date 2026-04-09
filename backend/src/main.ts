import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

type CorsCallback = (error: Error | null, allow?: boolean) => void;

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const frontendUrl = process.env.FRONTEND_URL;
  const defaultDevOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  const allowedOrigins = frontendUrl
    ? frontendUrl
        .split(',')
        .map(normalizeOrigin)
        .filter((origin) => origin.length > 0)
    : defaultDevOrigins.map(normalizeOrigin);

  app.enableCors({
    origin: (origin: string | undefined, callback: CorsCallback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(normalizeOrigin(origin))) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Property Platform API')
    .setDescription('Mini multi-tenant property listing platform API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const prismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);

  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
