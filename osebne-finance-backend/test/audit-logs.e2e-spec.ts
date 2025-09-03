import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import {AppModule} from "../src/app.module";

describe('Audit logs e2e', () => {
    let app: INestApplication;
    let token = '';

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();

        const email = `audit+${Date.now()}@mail.test`;
        const password = 'Geslo123';

        await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email, password })
            .expect(201);

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email, password })
            .expect(201);
        token = login.body.access_token;

        await request(app.getHttpServer())
            .post('/uploads')
            .set('Authorization', `Bearer ${token}`)
            .send({ source: 'audit-e2e', fileMetadata: { test: true } })
            .expect(201);
    });

    afterAll(async () => {
        await app.close();
    });

    it('vrne seznam audit logov', async () => {
        const res = await request(app.getHttpServer())
            .get('/audit-logs')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
    });
});
