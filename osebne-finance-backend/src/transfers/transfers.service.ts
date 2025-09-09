import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const useDbTriggers = () => process.env.USE_DB_TRIGGERS === 'true';

@Injectable()
export class TransfersService {
    constructor(private prisma: PrismaService) {}

    list(userId: number, from?: Date, to?: Date) {
        return this.prisma.transfer.findMany({
            where: {
                userId,
                ...(from || to ? { transferDate: { gte: from, lte: to } } : {}),
            },
            orderBy: { transferDate: 'desc' },
            include: { fromCategory: true, toCategory: true },
        });
    }

    create(userId: number, data: {
        fromCategoryId: number; toCategoryId: number; amount: string;
        currency?: string; description?: string; transferDate?: Date;
    }) {
        return this.prisma.$transaction(async (tx) => {
            const t = await tx.transfer.create({
                data: {
                    userId,
                    fromCategoryId: data.fromCategoryId,
                    toCategoryId: data.toCategoryId,
                    amount: data.amount,
                    currency: (data.currency ?? 'EUR').toUpperCase(),
                    description: data.description,
                    transferDate: data.transferDate ?? new Date(),
                },
            });

            if (!useDbTriggers()) {
                await tx.category.update({ where: { id: t.fromCategoryId }, data: { balance: { decrement: t.amount as any } } });
                await tx.category.update({ where: { id: t.toCategoryId }, data: { balance: { increment: t.amount as any } } });
            }

            return t;
        });
    }

    update(userId: number, id: number, data: {
        fromCategoryId?: number; toCategoryId?: number; amount?: string;
        currency?: string; description?: string; transferDate?: Date;
    }) {
        return this.prisma.$transaction(async (tx) => {
            const before = await tx.transfer.findUnique({ where: { id } });
            if (!before) throw new NotFoundException('Prenos ne obstaja');

            const t = await tx.transfer.update({
                where: { id },
                data: {
                    ...(data.fromCategoryId ? { fromCategoryId: data.fromCategoryId } : {}),
                    ...(data.toCategoryId ? { toCategoryId: data.toCategoryId } : {}),
                    ...(data.amount ? { amount: data.amount } : {}),
                    ...(data.currency ? { currency: data.currency.toUpperCase() } : {}),
                    ...(data.description !== undefined ? { description: data.description } : {}),
                    ...(data.transferDate ? { transferDate: data.transferDate } : {}),
                },
            });

            if (!useDbTriggers()) {
                await tx.category.update({ where: { id: before.fromCategoryId }, data: { balance: { increment: before.amount as any } } });
                await tx.category.update({ where: { id: before.toCategoryId }, data: { balance: { decrement: before.amount as any } } });
                await tx.category.update({ where: { id: t.fromCategoryId }, data: { balance: { decrement: t.amount as any } } });
                await tx.category.update({ where: { id: t.toCategoryId }, data: { balance: { increment: t.amount as any } } });
            }

            return t;
        });
    }

    remove(userId: number, id: number) {
        return this.prisma.$transaction(async (tx) => {
            const t = await tx.transfer.delete({ where: { id } });
            if (!useDbTriggers()) {
                await tx.category.update({ where: { id: t.fromCategoryId }, data: { balance: { increment: t.amount as any } } });
                await tx.category.update({ where: { id: t.toCategoryId }, data: { balance: { decrement: t.amount as any } } });
            }
            return t;
        });
    }
}
