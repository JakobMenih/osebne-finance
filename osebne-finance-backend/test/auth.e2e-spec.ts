import { INestApplication } from '@nestjs/common';
import { makeApp, http } from './test-helpers';

describe('Auth', () => {
    let app: INestApplication;
    beforeAll(async () => { app = await makeApp(); });
    afterAll(async () => { await app.close(); });

    it('register + login + profile', async () => {
        const api = http(app);
        const email = `auth_${Date.now()}@example.com`;
        const password = 'Passw0rd!';
        await api.post('/auth/register').send({ email, password }).expect(201);
        const login = await api.post('/auth/login').send({ email, password }).expect(200);
        const token = login.body.access_token;
        await api.post('/auth/profile').set('Authorization', `Bearer ${token}`).expect(200);
    });
});
