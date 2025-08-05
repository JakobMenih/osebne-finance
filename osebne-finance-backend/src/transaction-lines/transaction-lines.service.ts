import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionLineDto } from './dto/create-transaction-line.dto';
import { UpdateTransactionLineDto } from './dto/update-transaction-line.dto';

@Injectable()
export class TransactionLinesService {
    constructor(private prisma: PrismaService) {}

    async findAll(transactionId: string, userId: string) {
        return this.prisma.transactionLine.findMany({
            where: { transactionId, transaction: { userId } }
        });
    }

    async findOne(id: string, userId: string) {
        return this.prisma.transactionLine.findFirstOrThrow({
            where: { id, transaction: { userId } }
        });
    }

    async create(userId: string, dto: CreateTransactionLineDto) {
        const tx = await this.prisma.transaction.findFirst({
            where: { id: dto.transactionId, userId }
        });
        if (!tx) throw new NotFoundException('Transaction not found');

        return this.prisma.transactionLine.create({
            data: {
                transactionId: dto.transactionId,
                accountId: dto.accountId,
                categoryId: dto.categoryId,
                amount: dto.amount,
                currency: dto.currency,
                description: dto.description
            }
        });
    }


    async update(id: string, userId: string, dto: UpdateTransactionLineDto) {
        const updated = await this.prisma.transactionLine.updateMany({
            where: { id, transaction: { userId } },
            data: dto
        });
        if (updated.count === 0) throw new NotFoundException(`Transaction line with id ${id} not found`);
        return this.findOne(id, userId);
    }

    remove(id: string, userId: string) {
        return this.prisma.transactionLine.deleteMany({
            where: { id, transaction: { userId } }
        });
    }
}
