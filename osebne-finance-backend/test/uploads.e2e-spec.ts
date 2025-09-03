import { INestApplication } from '@nestjs/common';
import { makeApp, http, registerAndLogin, withAuth } from './test-helpers';

describe('Uploads', () => {
    let app: INestApplication, token: string;
    beforeAll(async () => { app = await makeApp(); token = (await registerAndLogin(http(app))).token; });
    afterAll(async () => { await app.close(); });

    it('upload → list', async () => {
        const api = withAuth(http(app), token);
        const buf = Buffer.from('%PDF-1.4\n%test\n');
        const up = await api.post('/uploads').attach('file', buf, 'racun.jpg').expect(201);
        await api.get('/uploads').expect(200);
        await api.get(`/uploads/${up.body.id}/download`).expect(200);
    });
});
