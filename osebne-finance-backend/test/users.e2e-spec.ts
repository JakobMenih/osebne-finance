import { INestApplication } from '@nestjs/common';
import { makeApp, http, registerAndLogin, withAuth } from './test-helpers';

describe('Users E2E', () => {
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

    it('prebere profil preko /auth/profile', async () => {
        const api = withAuth(http(app), token);
        const res = await api.post('/auth/profile').send({});
        expect(res.status).toBe(200); // profil vrača 200
        expect(res.body).toHaveProperty('userId');
        expect(res.body).toHaveProperty('email');
    });
});
