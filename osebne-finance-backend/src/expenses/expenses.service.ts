import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const useDbTriggers = () => process.env.USE_DB_TRIGGERS === 'true';

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

    async getWithUploads(userId: number, id: number) {
        const expense = await this.prisma.expense.findFirst({
            where: { id, userId },
            include: { category: true },
        });
        if (!expense) throw new NotFoundException('Odhodek ne obstaja');

        const links = await this.prisma.expenseUpload.findMany({
            where: { expense_id: id },
            select: { upload_id: true },
        });

        const uploads = links.length
            ? await this.prisma.upload.findMany({ where: { id: { in: links.map((l) => l.upload_id) } } })
            : [];

        return { ...expense, uploads };
    }

    create(
        userId: number,
        data: { categoryId: number; amount: string; currency?: string; description?: string; transactionDate?: Date; uploadIds?: number[] },
    ) {
        return this.prisma.$transaction(async (tx) => {
            const expense = await tx.expense.create({
                data: {
                    userId,
                    categoryId: data.categoryId,
                    amount: data.amount,
                    currency: (data.currency ?? 'EUR').toUpperCase(),
                    description: data.description,
                    transactionDate: data.transactionDate ?? new Date(),
                },
            });

            if (!useDbTriggers()) {
                await tx.category.update({
                    where: { id: expense.categoryId },
                    data: { balance: { decrement: expense.amount as any } },
                });
            }

            if (data.uploadIds?.length) {
                await tx.expenseUpload.createMany({
                    data: data.uploadIds.map((u) => ({ expense_id: expense.id, upload_id: u })),
                    skipDuplicates: true,
                });
            }

            return expense;
        });
    }

    update(
        userId: number,
        id: number,
        data: { categoryId?: number; amount?: string; currency?: string; description?: string; transactionDate?: Date; uploadIds?: number[] },
    ) {
        return this.prisma.$transaction(async (tx) => {
            const before = await tx.expense.findUnique({ where: { id } });
            if (!before) throw new NotFoundException('Odhodek ne obstaja');

            const expense = await tx.expense.update({
                where: { id },
                data: {
                    ...(data.categoryId ? { categoryId: data.categoryId } : {}),
                    ...(data.amount ? { amount: data.amount } : {}),
                    ...(data.currency ? { currency: data.currency.toUpperCase() } : {}),
                    ...(data.description !== undefined ? { description: data.description } : {}),
                    ...(data.transactionDate ? { transactionDate: data.transactionDate } : {}),
                },
            });

            if (!useDbTriggers()) {
                if (data.categoryId && data.categoryId !== before.categoryId) {
                    await tx.category.update({ where: { id: before.categoryId }, data: { balance: { increment: before.amount as any } } });
                    await tx.category.update({ where: { id: expense.categoryId }, data: { balance: { decrement: expense.amount as any } } });
                } else if (data.amount) {
                    const diff = Number(expense.amount) - Number(before.amount);
                    if (diff !== 0) {
                        await tx.category.update({ where: { id: expense.categoryId }, data: { balance: { decrement: diff } } });
                    }
                }
            }

            if (data.uploadIds) {
                await tx.expenseUpload.deleteMany({ where: { expense_id: id } });
                if (data.uploadIds.length) {
                    await tx.expenseUpload.createMany({
                        data: data.uploadIds.map((u) => ({ expense_id: id, upload_id: u })),
                        skipDuplicates: true,
                    });
                }
            }

            return expense;
        });
    }

    remove(userId: number, id: number) {
        return this.prisma.$transaction(async (tx) => {
            const deleted = await tx.expense.delete({ where: { id } });
            if (!useDbTriggers()) {
                await tx.category.update({
                    where: { id: deleted.categoryId },
                    data: { balance: { increment: deleted.amount as any } },
                });
            }
            return deleted;
        });
    }
}
