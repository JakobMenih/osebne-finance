import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
    constructor(private prisma: PrismaService) {}

    findAll(userId: string) {
        return this.prisma.transaction.findMany({ where: { userId }, include: { lines: true } });
    }

    findOne(id: string, userId: string) {
        return this.prisma.transaction.findFirstOrThrow({ where: { id, userId }, include: { lines: true } });
    }

    create(userId: string, dto: CreateTransactionDto) {
        return this.prisma.transaction.create({ data: { userId, date: new Date(dto.date), description: dto.description, metadata: dto.metadata } });
    }

    update(id: string, userId: string, dto: UpdateTransactionDto) {
        return this.prisma.transaction.updateMany({ where: { id, userId }, data: { date: dto.date ? new Date(dto.date) : undefined, description: dto.description, metadata: dto.metadata } });
    }

    remove(id: string, userId: string) {
        return this.prisma.transaction.deleteMany({ where: { id, userId } });
    }
}