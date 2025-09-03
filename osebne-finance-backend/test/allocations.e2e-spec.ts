import { INestApplication } from '@nestjs/common';
import { makeApp, http, registerAndLogin, withAuth } from './test-helpers';

describe('Allocations E2E', () => {
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

    it('GET /allocations', async () => {
        const api = withAuth(http(app), token);
        const res = await api.get('/allocations');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
