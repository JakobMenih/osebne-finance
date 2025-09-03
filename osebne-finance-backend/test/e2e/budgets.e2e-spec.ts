import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { bootstrap, authToken } from './utils';

describe('Budgets', () => {
    let app: INestApplication;
    let token: string;

    beforeAll(async () => { ({ app } = await bootstrap()); token = await authToken(app, 'bud1@example.com'); });
    afterAll(async () => { await app.close(); });

    it('CRUD proračunov', async () => {
        const cat = await request(app.getHttpServer()).post('/categories')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Prehrana', type: 'EXPENSE' })
            .expect(201);

        const b = await request(app.getHttpServer()).post('/budgets')
            .set('Authorization', `Bearer ${token}`)
            .send({
                categoryId: cat.body.id,
                periodStart: '2025-09-01',
                periodEnd: '2025-09-30',
                amount: 300
            })
            .expect(201);

        const id = b.body.id;

        await request(app.getHttpServer()).get('/budgets').set('Authorization', `Bearer ${token}`).expect(200);
        await request(app.getHttpServer()).get(`/budgets/${id}`).set('Authorization', `Bearer ${token}`).expect(200);
        await request(app.getHttpServer()).patch(`/budgets/${id}`).set('Authorization', `Bearer ${token}`).send({ amount: 350 }).expect(200);
        await request(app.getHttpServer()).delete(`/budgets/${id}`).set('Authorization', `Bearer ${token}`).expect(200);
    });
});
