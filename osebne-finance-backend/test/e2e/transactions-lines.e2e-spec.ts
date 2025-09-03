import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { bootstrap, authToken } from './utils';

describe('Transaction Lines', () => {
    let app: INestApplication;
    let token: string;

    beforeAll(async () => { ({ app } = await bootstrap()); token = await authToken(app, 'tl1@example.com'); });
    afterAll(async () => { await app.close(); });

    it('ustvari postavko z valuto iz računa in prebere seznam', async () => {
        const acc = await request(app.getHttpServer()).post('/accounts')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Kartica', type: 'CHECKING', currency: 'EUR' })
            .expect(201);

        const cat = await request(app.getHttpServer()).post('/categories')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Trgovina', type: 'EXPENSE' })
            .expect(201);

        const tx = await request(app.getHttpServer()).post('/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send({ date: '2025-09-03', description: 'Nakup' })
            .expect(201);

        const line = await request(app.getHttpServer()).post('/transaction-lines')
            .set('Authorization', `Bearer ${token}`)
            .send({
                transactionId: tx.body.id,
                accountId: acc.body.id,
                categoryId: cat.body.id,
                amount: 12.34,
                description: 'Mleko'
            })
            .expect(201);

        expect(line.body.currency).toBe('EUR');

        await request(app.getHttpServer()).get(`/transaction-lines/${tx.body.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });
});
