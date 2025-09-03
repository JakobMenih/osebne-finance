import { INestApplication } from '@nestjs/common';
import { makeApp, http, registerAndLogin, withAuth } from './test-helpers';

describe('Transaction Lines E2E', () => {
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

    it('placeholder GET /transactions (za lines test)', async () => {
        const api = withAuth(http(app), token);
        const res = await api.get('/transactions');
        expect(res.status).toBe(200);
    });
});
