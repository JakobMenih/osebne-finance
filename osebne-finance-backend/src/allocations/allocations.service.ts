import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AllocationsService {
    constructor(private readonly prisma: PrismaService) {}

    create(userId: string, data: { accountId?: string; categoryId: string; amount: number; currency: string; note?: string }) {
        return this.prisma.categoryAllocation.create({
            data: { userId, accountId: data.accountId ?? null, categoryId: data.categoryId, amount: data.amount, currency: data.currency, note: data.note ?? null },
        });
    }

    list(userId: string) {
        return this.prisma.categoryAllocation.findMany({ where: { userId } });
    }
}
