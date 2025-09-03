import { INestApplication } from '@nestjs/common';
import { makeApp, http, registerAndLogin, withAuth } from './test-helpers';

describe('Accounts', () => {
    let app: INestApplication, token: string;
    beforeAll(async () => { app = await makeApp(); token = (await registerAndLogin(http(app))).token; });
    afterAll(async () => { await app.close(); });

    it('CRUD', async () => {
        const api = withAuth(http(app), token);
        const c = await api.post('/accounts').send({ name: 'TRR', type: 'checking', currency: 'EUR' }).expect(201);
        const id = c.body.id;
        await api.get('/accounts').expect(200);
        await api.get(`/accounts/${id}`).expect(200);
        await api.patch(`/accounts/${id}`).send({ name: 'Glavni' }).expect(200);
        await api.delete(`/accounts/${id}`).expect(200);
    });
});
