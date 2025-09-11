import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
        const income = await this.prisma.income.findFirst({ where: { id, userId } });
        if (!income) return null;
        const links = await this.prisma.incomeUpload.findMany({ where: { income_id: id } });
        const uploads = links.length
            ? await this.prisma.upload.findMany({
                where: { id: { in: links.map((l) => l.upload_id) }, userId },
            })
            : [];
        return { ...income, uploads };
    }

    async create(
        userId: number,
        data: { categoryId: number; amount: number; currency?: string; description?: string | null; transactionDate?: Date; uploadIds?: number[] },
    ) {
        return this.prisma.$transaction(async (tx) => {
            const income = await tx.income.create({
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
                await tx.incomeUpload.create({ data: { income_id: income.id, upload_id: uploadId } });
            }
            return income;
        });
    }

    async update(
        userId: number,
        id: number,
        data: { amount?: number; currency?: string; description?: string | null; transactionDate?: Date; uploadIds?: number[] },
    ) {
        return this.prisma.$transaction(async (tx) => {
            const income = await tx.income.update({
                where: { id, userId },
                data: {
                    amount: data.amount,
                    currency: data.currency,
                    description: data.description ?? null,
                    transactionDate: data.transactionDate,
                },
            });
            if (data.uploadIds) {
                await tx.incomeUpload.deleteMany({ where: { income_id: id } });
                const validUploadIds = data.uploadIds.length
                    ? (await tx.upload.findMany({ where: { id: { in: data.uploadIds }, userId }, select: { id: true } })).map((u) => u.id)
                    : [];
                for (const uploadId of validUploadIds) {
                    await tx.incomeUpload.create({ data: { income_id: id, upload_id: uploadId } });
                }
            }
            return income;
        });
    }

    remove(userId: number, id: number) {
        return this.prisma.$transaction(async (tx) => {
            const current = await tx.income.findFirst({ where: { id, userId } });
            if (!current) return null;
            await tx.incomeUpload.deleteMany({ where: { income_id: id } });
            return tx.income.delete({ where: { id, userId } });
        });
    }
}
