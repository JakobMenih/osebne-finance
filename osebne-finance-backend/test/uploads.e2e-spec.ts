import { INestApplication } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import makeApp, { http, registerAndLogin, withAuth } from './test-helpers';

describe('Uploads', () => {
    let app: INestApplication;
    let token: string;

    beforeAll(async () => {
        app = await makeApp();
        const api = http(app);
        const session = await registerAndLogin(api);
        token = session.token;
    });
    afterAll(async () => { await app.close(); });

    it('naloži datoteko in jo poveže na prihodek', async () => {
        const api = withAuth(http(app), token);

        const cat = (await api.post('/categories').send({ name: 'Dokumenti' })).body;
        const inc = (await api.post('/incomes').send({ categoryId: cat.id, amount: '10.00', description: 'Test' })).body;

        const tmp = path.resolve(process.cwd(), 'tmp-upload.txt');
        fs.writeFileSync(tmp, 'hello');

        const up = await api
            .post('/uploads')
            .field('source', 'test')
            .attach('file', fs.createReadStream(tmp), { filename: 'tmp-upload.txt', contentType: 'text/plain' })
            .expect(201);

        const uploadId = up.body.id;

        await api.post(`/uploads/${uploadId}/link/income/${inc.id}`).expect(201);

        const incWith = await api.get(`/incomes/${inc.id}`).expect(200);
        expect(Array.isArray(incWith.body.uploads)).toBe(true);
        expect(incWith.body.uploads.length).toBeGreaterThan(0);

        fs.unlinkSync(tmp);
    });
});
