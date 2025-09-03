import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {PrismaService} from "../prisma/prisma.service";
import {CreateTransactionDto} from "./dto/create-transaction.dto";

@Injectable()
export class TransactionsService {
    constructor(private readonly prisma: PrismaService) {}

    findAll(userId: string) {
        return this.prisma.transaction.findMany({ where: { userId } });
    }

    findOne(id: string, userId: string) {
        return this.prisma.transaction.findFirst({ where: { id, userId } });
    }

    create(userId: string, dto: CreateTransactionDto) {
        return this.prisma.transaction.create({
            data: {
                user: { connect: { id: userId } },
                date: new Date(dto.date),
                description: dto.description,
                metadata: dto.metadata ?? undefined,
            },
        });
    }

    async createWithLines(userId: string, payload: {
        date: string;
        description?: string;
        lines: Array<{ accountId: string; categoryId?: string; amount: number; description?: string }>;
    }) {
        return this.prisma.$transaction(async (tx) => {
            const head = await tx.transaction.create({
                data: { userId, date: new Date(payload.date), description: payload.description ?? null },
            });

            const accounts = await tx.account.findMany({
                where: { id: { in: payload.lines.map(l => l.accountId) }, userId },
                select: { id: true, currency: true },
            });
            const currencies = new Map(accounts.map(a => [a.id, a.currency]));

            await tx.transactionLine.createMany({
                data: payload.lines.map(l => ({
                    transactionId: head.id,
                    accountId: l.accountId,
                    categoryId: l.categoryId ?? null,
                    amount: l.amount,
                    currency: currencies.get(l.accountId)!,
                    description: l.description ?? null,
                })),
            });

            return head;
        });
    }

    update(id: string, userId: string, data: Prisma.TransactionUpdateInput) {
        return this.prisma.transaction.updateMany({ where: { id, userId }, data });
    }

    remove(id: string, userId: string) {
        return this.prisma.transaction.deleteMany({ where: { id, userId } });
    }

}
