import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Personal Finance API (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let jwt: string;
    let userId: string;
    let accountId: string;
    let categoryId: string;
    let transactionId: string;
    let lineId: string;
    let budgetId: string;
    let uploadId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();

        prisma = app.get(PrismaService);
        // clean up any existing data
        await prisma.transactionLine.deleteMany();
        await prisma.transaction.deleteMany();
        await prisma.budget.deleteMany();
        await prisma.category.deleteMany();
        await prisma.account.deleteMany();
        await prisma.upload.deleteMany();
        await prisma.auditLog.deleteMany();
        await prisma.user.deleteMany();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should register a new user', async () => {
        const res = await request(app.getHttpServer())
            .post('/users')
            .send({ email: 'jane@doe.test', password: 'secret!', name: 'Jane Doe' })
            .expect(201);
        expect(res.body).toHaveProperty('id');
        userId = res.body.id;
    });

    it('should reject protected route without token', () => {
        return request(app.getHttpServer())
            .get('/accounts')
            .expect(401);
    });

    it('should login and receive a JWT', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'jane@doe.test', password: 'secret!' })
            .expect(201);
        expect(res.body).toHaveProperty('access_token');
        jwt = res.body.access_token;
    });

    it('should return user profile', () => {
        return request(app.getHttpServer())
            .post('/auth/profile')
            .set('Authorization', `Bearer ${jwt}`)
            .expect(200)
            .expect(({ body }) => {
                expect(body).toEqual({ userId, email: 'jane@doe.test' });
            });
    });

    describe('Accounts', () => {
        it('should create an account', async () => {
            const res = await request(app.getHttpServer())
                .post('/accounts')
                .set('Authorization', `Bearer ${jwt}`)
                .send({ userId, name: 'Checking', type: 'checking', currency: 'USD' })
                .expect(201);
            expect(res.body).toHaveProperty('id');
            accountId = res.body.id;
        });

        it('should list accounts', () =>
            request(app.getHttpServer())
                .get('/accounts')
                .set('Authorization', `Bearer ${jwt}`)
                .expect(200)
                .expect(Array.isArray));

        it('should get one account', () =>
            request(app.getHttpServer())
                .get(`/accounts/${accountId}`)
                .set('Authorization', `Bearer ${jwt}`)
                .expect(200)
                .expect(({ body }) => {
                    expect(body.id).toBe(accountId);
                }));

        it('should update account', () =>
            request(app.getHttpServer())
                .patch(`/accounts/${accountId}`)
                .set('Authorization', `Bearer ${jwt}`)
                .send({ name: 'Everyday Checking' })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.name).toBe('Everyday Checking');
                }));

        it('should delete account', () =>
            request(app.getHttpServer())
                .delete(`/accounts/${accountId}`)
                .set('Authorization', `Bearer ${jwt}`)
                .expect(200));
    });

    describe('Categories', () => {
        it('should create a category', async () => {
            const res = await request(app.getHttpServer())
                .post('/categories')
                .set('Authorization', `Bearer ${jwt}`)
                .send({ name: 'Food', type: 'expense' });
            expect(res.status).toBe(201);
            categoryId = res.body.id;
        });

        it('should list categories', () =>
            request(app.getHttpServer())
                .get('/categories')
                .set('Authorization', `Bearer ${jwt}`)
                .expect(200)
                .expect(Array.isArray));

        it('should get one category', () =>
            request(app.getHttpServer())
                .get(`/categories/${categoryId}`)
                .set('Authorization', `Bearer ${jwt}`)
                .expect(200)
                .expect(({ body }) => expect(body.id).toBe(categoryId)));

        it('should update category', () =>
            request(app.getHttpServer())
                .patch(`/categories/${categoryId}`)
                .set('Authorization', `Bearer ${jwt}`)
                .send({ name: 'Groceries' })
                .expect(200)
                .expect(({ body }) => expect(body.count).toBe(1)));

        it('should delete category', () =>
            request(app.getHttpServer())
                .delete(`/categories/${categoryId}`)
                .set('Authorization', `Bearer ${jwt}`)
                .expect(200));
    });

    describe('Transactions & Lines', () => {
        beforeAll(async () => {
            // recreate an account & category for transactions
            const acc = await prisma.account.create({
                data: { userId, name: 'Temp', type: 'checking', currency: 'USD' },
            });
            accountId = acc.id;
            const cat = await prisma.category.create({
                data: { userId, name: 'Bills', type: 'expense' },
            });
            categoryId = cat.id;
        });

        it('should create a transaction', async () => {
            const res = await request(app.getHttpServer())
                .post('/transactions')
                .set('Authorization', `Bearer ${jwt}`)
                .send({ date: '2025-01-01', description: 'Rent', metadata: {} });
            expect(res.status).toBe(201);
            transactionId = res.body.id;
        });

        it('should create a transaction line', async () => {
            const res = await request(app.getHttpServer())
                .post('/transaction-lines')
                .set('Authorization', `Bearer ${jwt}`)
                .send({
                    transactionId,
                    accountId,
                    categoryId,
                    amount: 950,
                    currency: 'USD',
                    description: 'January rent',
                });
            expect(res.status).toBe(201);
            lineId = res.body.id;
        });

        it('should list transaction lines for a tx', () =>
            request(app.getHttpServer())
                .get(`/transaction-lines/${transactionId}`)
                .set('Authorization', `Bearer ${jwt}`)
                .expect(200)
                .expect(Array.isArray));

        it('should update a transaction', () =>
            request(app.getHttpServer())
                .patch(`/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${jwt}`)
                .send({ description: 'First month rent' })
                .expect(200));

        it('should delete a transaction line', () =>
            request(app.getHttpServer())
                .delete(`/transaction-lines/${lineId}`)
                .set('Authorization', `Bearer ${jwt}`)
                .expect(200));

        it('should delete a transaction', () =>
            request(app.getHttpServer())
                .delete(`/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${jwt}`)
                .expect(200));
    });

    describe('Budgets', () => {
        it('should create a budget', async () => {
            const res = await request(app.getHttpServer())
                .post('/budgets')
                .set('Authorization', `Bearer ${jwt}`)
                .send({
                    categoryId,
                    periodStart: '2025-02-01',
                    periodEnd: '2025-02-28',
                    amount: 2000,
                });
            expect(res.status).toBe(201);
            budgetId = res.body.id;
        });

        it('should list budgets', () =>
            request(app.getHttpServer())
                .get('/budgets')
                .set('Authorization', `Bearer ${jwt}`)
                .expect(200)
                .expect(Array.isArray));

        it('should update budget', () =>
            request(app.getHttpServer())
                .patch(`/budgets/${budgetId}`)
                .set('Authorization', `Bearer ${jwt}`)
                .send({ amount: 1800 })
                .expect(200));

        it('should delete budget', () =>
            request(app.getHttpServer())
                .delete(`/budgets/${budgetId}`)
                .set('Authorization', `Bearer ${jwt}`)
                .expect(200));
    });

    describe('Uploads', () => {
        it('should create an upload record', async () => {
            const res = await request(app.getHttpServer())
                .post('/uploads')
                .set('Authorization', `Bearer ${jwt}`)
                .send({ source: 'bank_statement.pdf', fileMetadata: {} });
            expect(res.status).toBe(201);
            uploadId = res.body.id;
        });

        it('should list uploads', () =>
            request(app.getHttpServer())
                .get('/uploads')
                .set('Authorization', `Bearer ${jwt}`)
                .expect(200)
                .expect(Array.isArray));

        it('should get one upload', () =>
            request(app.getHttpServer())
                .get(`/uploads/${uploadId}`)
                .set('Authorization', `Bearer ${jwt}`)
                .expect(200)
                .expect(({ body }) => expect(body.id).toBe(uploadId)));

        it('should delete upload', () =>
            request(app.getHttpServer())
                .delete(`/uploads/${uploadId}`)
                .set('Authorization', `Bearer ${jwt}`)
                .expect(200));
    });

    describe('Audit Logs', () => {
        it('should list audit logs', () =>
            request(app.getHttpServer())
                .get('/audit-logs')
                .set('Authorization', `Bearer ${jwt}`)
                .expect(200)
                .expect(Array.isArray));

        it('should get an audit log entry by id', async () => {
            // take the first log from the list
            const logsRes = await request(app.getHttpServer())
                .get('/audit-logs')
                .set('Authorization', `Bearer ${jwt}`);
            const logId = logsRes.body[0]?.id;
            if (logId) {
                await request(app.getHttpServer())
                    .get(`/audit-logs/${logId}`)
                    .set('Authorization', `Bearer ${jwt}`)
                    .expect(200)
                    .expect(({ body }) => expect(body.id).toBe(logId));
            }
        });
    });
});
