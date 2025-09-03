import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { bootstrap } from './utils';

describe('Auth', () => {
    let app: INestApplication;

    beforeAll(async () => { ({ app } = await bootstrap()); });
    afterAll(async () => { await app.close(); });

    it('registracija, prijava, profil', async () => {
        const email = 'auth1@example.com';
        const password = 'Passw0rd!';
        await request(app.getHttpServer()).post('/auth/register').send({ email, password }).expect(201);
        const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password }).expect(201);
        const token = login.body.access_token;
        await request(app.getHttpServer()).post('/auth/profile').set('Authorization', `Bearer ${token}`).expect(200);
    });

    it('zavrne brez žetona', async () => {
        await request(app.getHttpServer()).get('/accounts').expect(401);
    });
});
