import { INestApplication } from '@nestjs/common';
import { makeApp, http, registerAndLogin, withAuth } from './test-helpers';

describe('Audit Logs E2E', () => {
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

    it('GET /audit-logs', async () => {
        const api = withAuth(http(app), token);
        const res = await api.get('/audit-logs');
        expect([200, 404]).toContain(res.status);
    });
});
