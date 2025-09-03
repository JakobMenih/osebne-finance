import { INestApplication } from '@nestjs/common';
import { makeApp, http, registerAndLogin, withAuth } from './test-helpers';

describe('Categories E2E', () => {
    let app: INestApplication;
    let token: string;

    beforeAll(async () => {
        app = await makeApp();
        const api = http(app);
        const session = await registerAndLogin(api);
        token = session.token;
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /categories', async () => {
        const api = withAuth(http(app), token);
        const res = await api.get('/categories');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /categories', async () => {
        const api = withAuth(http(app), token);
        const res = await api.post('/categories').send({ name: 'Hrana', type: 'expense' });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
    });
});
