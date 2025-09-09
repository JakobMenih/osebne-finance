import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const useDbTriggers = () => process.env.USE_DB_TRIGGERS === 'true';

@Injectable()
export class IncomesService {
    constructor(private prisma: PrismaService) {}

    list(userId: number, categoryId?: number, from?: Date, to?: Date) {
        return this.prisma.income.findMany({
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
        const income = await this.prisma.income.findFirst({
            where: { id, userId },
            include: { category: true },
        });
        if (!income) throw new NotFoundException('Prihodek ne obstaja');

        const links = await this.prisma.incomeUpload.findMany({
            where: { income_id: id },
            select: { upload_id: true },
        });

        const uploads = links.length
            ? await this.prisma.upload.findMany({ where: { id: { in: links.map((l) => l.upload_id) } } })
            : [];

        return { ...income, uploads };
    }

    create(
        userId: number,
        data: { categoryId: number; amount: string; currency?: string; description?: string; transactionDate?: Date; uploadIds?: number[] },
    ) {
        return this.prisma.$transaction(async (tx) => {
            const income = await tx.income.create({
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
                    where: { id: income.categoryId },
                    data: { balance: { increment: income.amount as any } },
                });
            }

            if (data.uploadIds?.length) {
                await tx.incomeUpload.createMany({
                    data: data.uploadIds.map((u) => ({ income_id: income.id, upload_id: u })),
                    skipDuplicates: true,
                });
            }

            return income;
        });
    }

    update(
        userId: number,
        id: number,
        data: { categoryId?: number; amount?: string; currency?: string; description?: string; transactionDate?: Date; uploadIds?: number[] },
    ) {
        return this.prisma.$transaction(async (tx) => {
            const before = await tx.income.findUnique({ where: { id } });
            if (!before) throw new NotFoundException('Prihodek ne obstaja');

            const income = await tx.income.update({
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
                    await tx.category.update({ where: { id: before.categoryId }, data: { balance: { decrement: before.amount as any } } });
                    await tx.category.update({ where: { id: income.categoryId }, data: { balance: { increment: income.amount as any } } });
                } else if (data.amount) {
                    const diff = Number(income.amount) - Number(before.amount);
                    if (diff !== 0) {
                        await tx.category.update({ where: { id: income.categoryId }, data: { balance: { increment: diff } } });
                    }
                }
            }

            if (data.uploadIds) {
                await tx.incomeUpload.deleteMany({ where: { income_id: id } });
                if (data.uploadIds.length) {
                    await tx.incomeUpload.createMany({
                        data: data.uploadIds.map((u) => ({ income_id: id, upload_id: u })),
                        skipDuplicates: true,
                    });
                }
            }

            return income;
        });
    }

    remove(userId: number, id: number) {
        return this.prisma.$transaction(async (tx) => {
            const deleted = await tx.income.delete({ where: { id } });
            if (!useDbTriggers()) {
                await tx.category.update({
                    where: { id: deleted.categoryId },
                    data: { balance: { decrement: deleted.amount as any } },
                });
            }
            return deleted;
        });
    }
}
