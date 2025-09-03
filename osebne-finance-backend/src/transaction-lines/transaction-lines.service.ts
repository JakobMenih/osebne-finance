import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionLineDto } from './dto/create-transaction-line.dto';

@Injectable()
export class TransactionLinesService {
    constructor(private readonly prisma: PrismaService) {}

    async create(userId: string, dto: CreateTransactionLineDto) {
        const account = await this.prisma.account.findFirstOrThrow({
            where: { id: dto.accountId, userId },
        });
        await this.prisma.transaction.findFirstOrThrow({
            where: { id: dto.transactionId, userId },
        });

        return this.prisma.transactionLine.create({
            data: {
                transaction: { connect: { id: dto.transactionId } },
                account: { connect: { id: dto.accountId } },
                category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
                amount: dto.amount,
                currency: account.currency,
                description: dto.description ?? undefined,
            },
        });
    }

    findManyByTransaction(userId: string, transactionId: string) {
        return this.prisma.transactionLine.findMany({
            where: { transactionId, transaction: { userId } },
        });
    }

    findAll(transactionId: string, userId: string) {
        return this.prisma.transactionLine.findMany({
            where: { transactionId, transaction: { userId } },
        });
    }

    findOne(id: string, userId: string) {
        return this.prisma.transactionLine.findFirst({
            where: { id, transaction: { userId } },
        });
    }

    update(id: string, userId: string, data: Prisma.TransactionLineUpdateInput) {
        return this.prisma.transactionLine.updateMany({
            where: { id, transaction: { userId } },
            data,
        });
    }

    async remove(userId: string, id: string) {
        await this.prisma.transactionLine.findFirstOrThrow({
            where: { id, transaction: { userId } },
        });
        return this.prisma.transactionLine.delete({ where: { id } });
    }
}
