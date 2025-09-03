import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { bootstrap, authToken } from './utils';

describe('Audit Logs', () => {
    let app: INestApplication;
    let token: string;

    beforeAll(async () => { ({ app } = await bootstrap()); token = await authToken(app, 'al1@example.com'); });
    afterAll(async () => { await app.close(); });

    it('prebere seznam', async () => {
        await request(app.getHttpServer()).get('/audit-logs').set('Authorization', `Bearer ${token}`).expect(200);
    });
});
