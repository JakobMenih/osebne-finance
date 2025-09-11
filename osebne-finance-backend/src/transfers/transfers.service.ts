import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransfersService {
    constructor(private prisma: PrismaService) {}

    list(userId: number, from?: Date, to?: Date) {
        return this.prisma.transfer.findMany({
            where: { userId, transferDate: { gte: from, lte: to } },
            orderBy: { transferDate: 'desc' },
            include: { fromCategory: true, toCategory: true },
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

    async create(userId: number, data: { fromCategoryId: number; toCategoryId: number; amount: number; description?: string | null; transferDate?: Date }) {
        if (data.fromCategoryId === data.toCategoryId) throw new BadRequestException('Izbrani kategoriji morata biti različni.');
        const bal = await this.balance(userId, data.fromCategoryId);
        if (data.amount > bal) throw new BadRequestException('Na izvorni kategoriji ni dovolj sredstev za prenos.');
        return this.prisma.transfer.create({
            data: {
                userId,
                fromCategoryId: data.fromCategoryId,
                toCategoryId: data.toCategoryId,
                amount: data.amount,
                description: data.description ?? null,
                transferDate: data.transferDate ?? new Date(),
            },
        });
    }

    update(userId: number, id: number, data: { amount?: number; description?: string | null; transferDate?: Date }) {
        return this.prisma.transfer.update({ where: { id, userId }, data });
    }

    remove(userId: number, id: number) {
        return this.prisma.transfer.delete({ where: { id, userId } });
    }
}
