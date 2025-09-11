import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpensesService {
    constructor(private prisma: PrismaService) {}

    list(userId: number, categoryId?: number, from?: Date, to?: Date) {
        return this.prisma.expense.findMany({
            where: {
                userId,
                ...(categoryId ? { categoryId } : {}),
                ...(from || to ? { transactionDate: { gte: from, lte: to } } : {}),
            },
            orderBy: { transactionDate: 'desc' },
            include: { category: true },
        });
    }

    private async balance(userId: number, categoryId: number) {
        const [inc, exp, tin, tout] = await this.prisma.$transaction([
            this.prisma.income.aggregate({ where: { userId, categoryId }, _sum: { amount: true } }),
            this.prisma.expense.aggregate({ where: { userId, categoryId }, _sum: { amount: true } }),
            this.prisma.transfer.aggregate({ where: { userId, toCategoryId: categoryId }, _sum: { amount: true } }),
            this.prisma.transfer.aggregate({ where: { userId, fromCategoryId: categoryId }, _sum: { amount: true } }),
        ]);
        const s = (x: any) => Number(x._sum.amount || 0);
        return s(inc) - s(exp) + s(tin) - s(tout);
    }

    async getWithUploads(userId: number, id: number) {
        const expense = await this.prisma.expense.findFirst({ where: { id, userId } });
        if (!expense) return null;
        const links = await this.prisma.expenseUpload.findMany({ where: { expense_id: id } });
        const uploads = links.length
            ? await this.prisma.upload.findMany({
                where: { id: { in: links.map((l) => l.upload_id) }, userId },
            })
            : [];
        return { ...expense, uploads };
    }

    async create(
        userId: number,
        data: { categoryId: number; amount: number; currency?: string; description?: string | null; transactionDate?: Date; uploadIds?: number[] },
    ) {
        if (data.amount < 0) throw new BadRequestException('Znesek mora biti pozitiven.');
        const bal = await this.balance(userId, data.categoryId);
        if (data.amount > bal) throw new BadRequestException('Na kategoriji ni dovolj sredstev za ta odhodek.');
        return this.prisma.$transaction(async (tx) => {
            const expense = await tx.expense.create({
                data: {
                    userId,
                    categoryId: data.categoryId,
                    amount: data.amount,
                    currency: data.currency || 'EUR',
                    description: data.description ?? null,
                    transactionDate: data.transactionDate ?? new Date(),
                },
            });
            const validUploadIds = (data.uploadIds ?? []).length
                ? (await tx.upload.findMany({ where: { id: { in: data.uploadIds! }, userId }, select: { id: true } })).map((u) => u.id)
                : [];
            for (const uploadId of validUploadIds) {
                await tx.expenseUpload.create({ data: { expense_id: expense.id, upload_id: uploadId } });
            }
            return expense;
        });
    }

    async update(
        userId: number,
        id: number,
        data: { amount?: number; currency?: string; description?: string | null; transactionDate?: Date; uploadIds?: number[] },
    ) {
        return this.prisma.$transaction(async (tx) => {
            const current = await tx.expense.findFirst({ where: { id, userId } });
            if (!current) throw new BadRequestException('Odhodek ne obstaja.');
            if (typeof data.amount === 'number') {
                const bal = await this.balance(userId, current.categoryId);
                const delta = data.amount - Number(current.amount);
                if (delta > bal) throw new BadRequestException('Na kategoriji ni dovolj sredstev za spremembo odhodka.');
            }
            const expense = await tx.expense.update({
                where: { id, userId },
                data: {
                    amount: data.amount,
                    currency: data.currency,
                    description: data.description ?? null,
                    transactionDate: data.transactionDate,
                },
            });
            if (data.uploadIds) {
                await tx.expenseUpload.deleteMany({ where: { expense_id: id } });
                const validUploadIds = data.uploadIds.length
                    ? (await tx.upload.findMany({ where: { id: { in: data.uploadIds }, userId }, select: { id: true } })).map((u) => u.id)
                    : [];
                for (const uploadId of validUploadIds) {
                    await tx.expenseUpload.create({ data: { expense_id: id, upload_id: uploadId } });
                }
            }
            return expense;
        });
    }

    remove(userId: number, id: number) {
        return this.prisma.$transaction(async (tx) => {
            const current = await tx.expense.findFirst({ where: { id, userId } });
            if (!current) throw new BadRequestException('Odhodek ne obstaja.');
            await tx.expenseUpload.deleteMany({ where: { expense_id: id } });
            return tx.expense.delete({ where: { id, userId } });
        });
    }
}
