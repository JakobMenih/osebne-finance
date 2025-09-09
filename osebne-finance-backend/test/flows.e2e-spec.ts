import { INestApplication } from '@nestjs/common';
import makeApp, { http, registerAndLogin, withAuth } from './test-helpers';

const as2 = (v: any) => Number(v).toFixed(2);

describe('Finančni tokovi (incomes, expenses, transfers)', () => {
    let app: INestApplication;
    let token: string;

    beforeAll(async () => {
        app = await makeApp();
        const api = http(app);
        const session = await registerAndLogin(api);
        token = session.token;
    });
    afterAll(async () => { await app.close(); });

    it('pri prihodek/odhodek/prenos pravilno vplivajo na stanja', async () => {
        const api = withAuth(http(app), token);

        const k1 = (await api.post('/categories').send({ name: 'Tekoči račun' })).body;
        const k2 = (await api.post('/categories').send({ name: 'Varčevalni' })).body;
        (await api.post('/categories').send({ name: 'Hrana' })).body;

        await api.post('/incomes').send({ categoryId: k1.id, amount: '1000.00', description: 'Plača' }).expect(201);
        let cats = (await api.get('/categories').expect(200)).body;
        expect(as2(cats.find((c: any) => c.id === k1.id).balance)).toBe('1000.00');

        await api.post('/expenses').send({ categoryId: k1.id, amount: '150.00', description: 'Hrana' }).expect(201);
        cats = (await api.get('/categories').expect(200)).body;
        expect(as2(cats.find((c: any) => c.id === k1.id).balance)).toBe('850.00');

        await api.post('/transfers').send({ fromCategoryId: k1.id, toCategoryId: k2.id, amount: '200.00', description: 'Prihranek' }).expect(201);
        cats = (await api.get('/categories').expect(200)).body;
        expect(as2(cats.find((c: any) => c.id === k1.id).balance)).toBe('650.00');
        expect(as2(cats.find((c: any) => c.id === k2.id).balance)).toBe('200.00');
    });
});
