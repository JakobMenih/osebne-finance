import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as request from 'supertest';

export async function bootstrap() {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const prisma = await app.resolve(PrismaService);

    await resetDb(prisma);
    return { app, prisma };
}

export async function resetDb(prisma: PrismaService) {
    await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "audit_logs",
      "transaction_lines",
      "transactions",
      "budgets",
      "uploads",
      "accounts",
      "categories",
      "users"
    RESTART IDENTITY CASCADE;
  `);
}

export async function authToken(app: INestApplication, email = 'user@example.com', password = 'Passw0rd!') {
    await request(app.getHttpServer()).post('/auth/register').send({ email, password });
    const res = await request(app.getHttpServer()).post('/auth/login').send({ email, password });
    return res.body.access_token as string;
}
