import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as supertest from 'supertest';
import * as fs from 'fs';
import * as path from 'path';

function ensureEnv() {
    const dir = path.join(process.cwd(), 'tmp-uploads-e2e');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || dir;
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
}

export async function makeApp(): Promise<INestApplication> {
    ensureEnv();
    const mod: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    return app;
}

export function http(app: INestApplication) {
    return supertest(app.getHttpServer());
}

export async function registerAndLogin(api: any) {
    const email = `test_${Date.now()}@example.com`;
    const password = 'Passw0rd!';
    await api.post('/auth/register').send({ email, password });
    const login = await api.post('/auth/login').send({ email, password });
    return { token: login.body.access_token as string, email };
}

export function withAuth(api: any, token: string) {
    const setAuth = (t: any) => t.set('Authorization', `Bearer ${token}`);
    return {
        get:    (p: string) => setAuth(api.get(p)),
        post:   (p: string) => setAuth(api.post(p)),
        patch:  (p: string) => setAuth(api.patch(p)),
        delete: (p: string) => setAuth(api.delete(p)),
    };
}

export { withAuth as auth };
