import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionLineDto } from './dto/create-transaction-line.dto';
import { UpdateTransactionLineDto } from './dto/update-transaction-line.dto';

@Injectable()
export class TransactionLinesService {
    constructor(private prisma: PrismaService) {}

    findAll(transactionId: string) {
        return this.prisma.transactionLine.findMany({ where: { transactionId } });
    }

    findOne(id: string) {
        return this.prisma.transactionLine.findUniqueOrThrow({ where: { id } });
    }

    create(dto: CreateTransactionLineDto) {
        return this.prisma.transactionLine.create({ data: dto });
    }

    update(id: string, dto: UpdateTransactionLineDto) {
        return this.prisma.transactionLine.update({ where: { id }, data: dto });
    }

    remove(id: string) {
        return this.prisma.transactionLine.delete({ where: { id } });
    }
}