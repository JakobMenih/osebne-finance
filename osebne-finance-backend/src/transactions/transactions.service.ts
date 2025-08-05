import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
    constructor(private prisma: PrismaService) {}

    findAll(userId: string) {
        return this.prisma.transaction.findMany({ where: { userId } });
    }

    findOne(id: string, userId: string) {
        return this.prisma.transaction.findFirstOrThrow({ where: { id, userId } });
    }

    create(userId: string, dto: CreateTransactionDto) {
        return this.prisma.transaction.create({
            data: { userId, ...dto }
        });
    }

    async update(id: string, userId: string, dto: UpdateTransactionDto) {
        const updated = await this.prisma.transaction.updateMany({
            where: { id, userId },
            data: dto
        });
        if (updated.count === 0) throw new NotFoundException(`Transaction with id ${id} not found`);
        return this.prisma.transaction.findFirst({ where: { id, userId } });
    }

    remove(id: string, userId: string) {
        return this.prisma.transaction.deleteMany({ where: { id, userId } });
    }
}
