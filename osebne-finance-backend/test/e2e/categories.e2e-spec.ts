import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { bootstrap, authToken } from './utils';

describe('Categories', () => {
    let app: INestApplication;
    let token: string;

    beforeAll(async () => { ({ app } = await bootstrap()); token = await authToken(app, 'cat1@example.com'); });
    afterAll(async () => { await app.close(); });

    it('CRUD kategorij', async () => {
        const create = await request(app.getHttpServer()).post('/categories')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Hrana', type: 'EXPENSE' })
            .expect(201);
        const id = create.body.id;

        await request(app.getHttpServer()).get('/categories').set('Authorization', `Bearer ${token}`).expect(200);
        await request(app.getHttpServer()).get(`/categories/${id}`).set('Authorization', `Bearer ${token}`).expect(200);
        await request(app.getHttpServer()).patch(`/categories/${id}`).set('Authorization', `Bearer ${token}`).send({ name: 'Prehrana' }).expect(200);
        await request(app.getHttpServer()).delete(`/categories/${id}`).set('Authorization', `Bearer ${token}`).expect(200);
    });
});
