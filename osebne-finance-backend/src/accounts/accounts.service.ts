import { Injectable } from '@nestjs/common';
import { Prisma, Account } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountsService {
    constructor(private readonly prisma: PrismaService) {}

    create(userId: string, data: Omit<Prisma.AccountCreateInput, 'user'>) {
        const { name, type, currency, metadata } = data;
        return this.prisma.account.create({
            data: {
                name,
                type,
                currency,
                metadata: metadata ?? undefined,
                user: { connect: { id: userId } },
            },
        });
    }

    findAll(userId: string) {
        return this.prisma.account.findMany({ where: { userId } });
    }

    findOneOrThrow(id: string, userId: string): Promise<Account> {
        return this.prisma.account.findFirstOrThrow({ where: { id, userId } });
    }

    async update(id: string, userId: string, data: Prisma.AccountUpdateInput): Promise<Account> {
        await this.findOneOrThrow(id, userId);
        return this.prisma.account.update({ where: { id }, data });
    }

    async remove(id: string, userId: string): Promise<Account> {
        await this.findOneOrThrow(id, userId);
        return this.prisma.account.delete({ where: { id } });
    }
}
