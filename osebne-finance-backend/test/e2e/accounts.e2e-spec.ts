import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { bootstrap, authToken } from './utils';

describe('Accounts', () => {
    let app: INestApplication;
    let token: string;

    beforeAll(async () => { ({ app } = await bootstrap()); token = await authToken(app, 'acc1@example.com'); });
    afterAll(async () => { await app.close(); });

    it('CRUD računov', async () => {
        const create = await request(app.getHttpServer()).post('/accounts')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Osebni', type: 'CHECKING', currency: 'EUR' })
            .expect(201);
        const id = create.body.id;

        await request(app.getHttpServer()).get('/accounts').set('Authorization', `Bearer ${token}`).expect(200);
        await request(app.getHttpServer()).get(`/accounts/${id}`).set('Authorization', `Bearer ${token}`).expect(200);
        await request(app.getHttpServer()).patch(`/accounts/${id}`).set('Authorization', `Bearer ${token}`).send({ name: 'Glavni' }).expect(200);
        await request(app.getHttpServer()).delete(`/accounts/${id}`).set('Authorization', `Bearer ${token}`).expect(200);
    });
});
