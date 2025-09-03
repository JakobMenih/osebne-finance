import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { bootstrap, authToken } from './utils';

describe('Users', () => {
    let app: INestApplication;
    let token: string;
    let userId: string;

    beforeAll(async () => {
        ({ app } = await bootstrap());
        token = await authToken(app, 'users1@example.com');
        const me = await request(app.getHttpServer()).post('/auth/profile').set('Authorization', `Bearer ${token}`);
        userId = me.body.userId;
    });

    afterAll(async () => { await app.close(); });

    it('prebere in posodobi uporabnika', async () => {
        await request(app.getHttpServer()).get(`/users/${userId}`).set('Authorization', `Bearer ${token}`).expect(200);
        await request(app.getHttpServer()).patch(`/users/${userId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ settings: { locale: 'sl' } })
            .expect(200);
    });
});
