import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaExceptionFilter } from '../src/common/prisma-exception.filter';
import * as fs from 'fs';
import * as path from 'path';

export async function makeApp(): Promise<INestApplication> {
    process.env.JWT_SECRET      = process.env.JWT_SECRET      || 'test-secret';
    process.env.UPLOAD_DIR      = process.env.UPLOAD_DIR      || path.join(process.cwd(), 'uploads_test');
    process.env.USE_DB_TRIGGERS = 'true';
    process.env.DATABASE_URL    = process.env.DATABASE_URL    || 'postgresql://user:pass@localhost:5432/osebne_finance';

    process.env.ALLOWED_MIME    = process.env.ALLOWED_MIME    || 'image/png,image/jpeg,application/pdf,text/plain';

    if (!fs.existsSync(process.env.UPLOAD_DIR)) {
        fs.mkdirSync(process.env.UPLOAD_DIR, { recursive: true });
    }

    const app = await NestFactory.create(AppModule, { logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new PrismaExceptionFilter());
    await app.init();

    const prisma = app.get(PrismaService);
    await resetDb(prisma);

    await app.listen(0);
    return app;
}

export async function resetDb(prisma: PrismaService) {
    await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      expense_uploads,
      income_uploads,
      uploads,
      transfers,
      expenses,
      incomes,
      categories,
      users
    RESTART IDENTITY CASCADE;
  `);
}

export function http(app: INestApplication) {
    const request = require('supertest');
    return request(app.getHttpServer());
}

export async function registerAndLogin(api: any, email?: string, password?: string) {
    email = email || `test_${Date.now()}@example.com`;
    password = password || 'Passw0rd!';
    await api.post('/auth/register').send({ email, password }).expect(201);
    const login = await api.post('/auth/login').send({ email, password }).expect(200);
    return { token: login.body.access_token as string, email, password };
}

export function withAuth(api: any, token: string) {
    return {
        get:    (url: string) => api.get(url).set('Authorization', `Bearer ${token}`),
        post:   (url: string) => api.post(url).set('Authorization', `Bearer ${token}`),
        put:    (url: string) => api.put(url).set('Authorization', `Bearer ${token}`),
        patch:  (url: string) => api.patch(url).set('Authorization', `Bearer ${token}`),
        delete: (url: string) => api.delete(url).set('Authorization', `Bearer ${token}`),
        del:    (url: string) => api.delete(url).set('Authorization', `Bearer ${token}`),
    };
}
