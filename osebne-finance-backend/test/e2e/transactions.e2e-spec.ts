import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { bootstrap, authToken } from './utils';

describe('Transactions', () => {
    let app: INestApplication;
    let token: string;

    beforeAll(async () => { ({ app } = await bootstrap()); token = await authToken(app, 'tx1@example.com'); });
    afterAll(async () => { await app.close(); });

    it('CRUD transakcij', async () => {
        const tx = await request(app.getHttpServer()).post('/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send({ date: '2025-09-03', description: 'Nakup' })
            .expect(201);

        const id = tx.body.id;

        await request(app.getHttpServer()).get('/transactions').set('Authorization', `Bearer ${token}`).expect(200);
        await request(app.getHttpServer()).get(`/transactions/${id}`).set('Authorization', `Bearer ${token}`).expect(200);
        await request(app.getHttpServer()).patch(`/transactions/${id}`).set('Authorization', `Bearer ${token}`).send({ description: 'Nakup trgovina' }).expect(200);
        await request(app.getHttpServer()).delete(`/transactions/${id}`).set('Authorization', `Bearer ${token}`).expect(200);
    });
});
