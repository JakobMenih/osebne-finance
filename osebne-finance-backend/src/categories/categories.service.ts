import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) {}

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

    async list(userId: number) {
        const cats = await this.prisma.category.findMany({ where: { userId }, orderBy: { name: 'asc' } });
        const filled = await Promise.all(
            cats.map(async (c) => ({ ...c, balance: await this.balance(userId, c.id) }))
        );
        return filled;
    }

    create(userId: number, data: { name: string; description?: string | null }) {
        return this.prisma.category.create({ data: { userId, name: data.name, description: data.description ?? null } });
    }

    update(userId: number, id: number, data: { name?: string; description?: string | null }) {
        return this.prisma.category.update({ where: { id, userId }, data: { name: data.name, description: data.description ?? null } });
    }

    async remove(userId: number, id: number) {
        const bal = await this.balance(userId, id);
        if (Math.abs(bal) > 0.00001) {
            throw new BadRequestException('Kategorije ni mogoče izbrisati, dokler stanje ni 0,00.');
        }
        return this.prisma.category.delete({ where: { id, userId } });
    }
}
