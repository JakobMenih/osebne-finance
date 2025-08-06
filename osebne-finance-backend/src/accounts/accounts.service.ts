import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Account, Prisma } from '@prisma/client';

@Injectable()
export class AccountsService {
    constructor(private prisma: PrismaService) {}

    create(userId: string, data: Omit<Prisma.AccountCreateInput, 'user'>) {
        return this.prisma.account.create({
            data: {
                ...data,
                user: { connect: { id: userId } }
            }
        });
    }

    findAll(userId: string): Promise<Account[]> {
        return this.prisma.account.findMany({ where: { userId } });
    }

    async findOneOrThrow(id: string, userId: string): Promise<Account> {
        const account = await this.prisma.account.findFirst({ where: { id, userId } });
        if (!account) throw new NotFoundException(`Account with id ${id} not found`);
        return account;
    }

    async update(id: string, userId: string, data: Prisma.AccountUpdateInput): Promise<Account> {
        const updated = await this.prisma.account.updateMany({
            where: { id, userId },
            data
        });
        if (updated.count === 0) throw new NotFoundException(`Account with id ${id} not found`);
        return this.prisma.account.findFirst({ where: { id, userId } }) as Promise<Account>;
    }

    remove(id: string, userId: string): Promise<Account> {
        return this.prisma.account.delete({
            where: { id_userId: { id, userId } }
        });
    }
}
