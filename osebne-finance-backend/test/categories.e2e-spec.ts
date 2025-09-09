import { INestApplication } from '@nestjs/common';
import makeApp, { http, registerAndLogin, withAuth } from './test-helpers';

describe('Categories CRUD', () => {
    let app: INestApplication;
    let token: string;

    beforeAll(async () => {
        app = await makeApp();
        const api = http(app);
        const session = await registerAndLogin(api);
        token = session.token;
    });
    afterAll(async () => { await app.close(); });

    it('ustvari, prebere, posodobi, izbriše kategorijo', async () => {
        const api = withAuth(http(app), token);

        const created = await api.post('/categories').send({ name: 'Tekoči račun' }).expect(201);
        const id = created.body.id;

        const list = await api.get('/categories').expect(200);
        expect(list.body.some((c: any) => c.id === id)).toBe(true);

        await api.put(`/categories/${id}`).send({ description: 'Glavni račun', isDefault: true }).expect(200);
        await api.delete(`/categories/${id}`).expect(200);
    });
});
