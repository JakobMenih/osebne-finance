import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new PrismaExceptionFilter());

    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    await app.listen(port, '0.0.0.0');

    app.enableCors({
        origin: process.env.CORS_ORIGIN?.split(',') ?? [process.env.CORS_ORIGIN],
        credentials: true,
    });
}
bootstrap();
