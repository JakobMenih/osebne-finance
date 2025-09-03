import { INestApplication } from '@nestjs/common';
import { makeApp, http } from './test-helpers';

describe('App E2E', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await makeApp();
    });

    afterAll(async () => {
        await app.close();
    });

    it('zažene aplikacijo', async () => {
        const res = await http(app).get('/'); // če nimaš root rute, lahko ta test odstraniš
        expect([200, 404]).toContain(res.status);
    });
});
