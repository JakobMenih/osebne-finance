import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { bootstrap, authToken } from './utils';

describe('Uploads', () => {
    let app: INestApplication;
    let token: string;

    beforeAll(async () => {
        ({ app } = await bootstrap());
        token = await authToken(app, 'up1@example.com');
    });

    afterAll(async () => { await app.close(); });

    it('naloži, prebere, prenese in izbriše', async () => {
        const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO1fD0kAAAAASUVORK5CYII=';
        const png = Buffer.from(pngBase64, 'base64');

        const up = await request(app.getHttpServer())
            .post('/uploads/file')
            .set('Authorization', `Bearer ${token}`)
            .field('source', 'upload')
            .attach('file', png, { filename: 'slika.png', contentType: 'image/png' })
            .expect(201);


        const id = up.body.id as string;

        const res = await request(app.getHttpServer())
            .post('/uploads/file')
            .set('Authorization', `Bearer ${token}`)
            .field('source', 'upload')
            .attach('file', png, { filename: 'slika.png', contentType: 'image/png' });

        console.log('UPLOAD RES:', res.status, res.body); // začasno
        expect(res.status).toBe(201);

        await request(app.getHttpServer()).get('/uploads')
            .set('Authorization', `Bearer ${token}`).expect(200);

        await request(app.getHttpServer()).get(`/uploads/${id}/download`)
            .set('Authorization', `Bearer ${token}`).expect(200);

        await request(app.getHttpServer()).delete(`/uploads/${id}`)
            .set('Authorization', `Bearer ${token}`).expect(200);
    });

    it('zavrne brez datoteke', async () => {
        await request(app.getHttpServer())
            .post('/uploads/file')
            .set('Authorization', `Bearer ${token}`)
            .expect(400);
    });
});
