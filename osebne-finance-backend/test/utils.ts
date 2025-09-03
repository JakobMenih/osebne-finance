import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as request from 'supertest';

export async function bootstrap(): Promise<{ app: INestApplication }> {
    process.env.BASE_CURRENCY = process.env.BASE_CURRENCY || 'EUR';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/financnik_test?schema=osebne_finance';
    process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads_test');
    if (!fs.existsSync(process.env.UPLOAD_DIR)) fs.mkdirSync(process.env.UPLOAD_DIR, { recursive: true });

    const app = await NestFactory.create(AppModule, { logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const prisma = app.get(PrismaService);
    await resetDb(prisma);

    await app.listen(0);
    return { app };
}

export async function resetDb(prisma: PrismaService) {
    await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      osebne_finance.audit_logs,
      osebne_finance.upload_links,
      osebne_finance.uploads,
      osebne_finance.transaction_lines,
      osebne_finance.transactions,
      osebne_finance.budgets,
      osebne_finance.category_allocations,
      osebne_finance.fx_rates,
      osebne_finance.accounts,
      osebne_finance.categories,
      osebne_finance.users
    RESTART IDENTITY CASCADE;
  `);
}

export async function authToken(app: INestApplication, email = 'test@example.com', password = 'Passw0rd!') {
    await request(app.getHttpServer()).post('/auth/register').send({ email, password });
    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password });
    return login.body.access_token as string;
}
