import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class BudgetsService {
    constructor(private readonly prisma: PrismaService) {}

    upsert(userId: string, data: Prisma.BudgetUncheckedCreateInput) {
        return this.prisma.budget.upsert({
            where: { userId_categoryId_periodStart: { userId, categoryId: data.categoryId, periodStart: data.periodStart as any } },
            create: { ...data, userId },
            update: { amount: data.amount, metadata: data.metadata ?? {} },
        });
    }

    list(userId: string) {
        return this.prisma.budget.findMany({ where: { userId } });
    }
}
