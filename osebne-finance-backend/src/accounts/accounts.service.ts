import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Account } from '@prisma/client';

@Injectable()
export class AccountsService {
    constructor(private readonly prisma: PrismaService) {}

    create(userId: string, data: Omit<Prisma.AccountCreateInput, 'user'>) {
        const { name, type, currency, metadata } = data;
        return this.prisma.account.create({
            data: { name, type, currency, metadata: (metadata as any) ?? undefined, user: { connect: { id: userId } } },
        });
    }

    findAll(userId: string) {
        return this.prisma.account.findMany({ where: { userId } });
    }

    findOneOrThrow(id: string, userId: string) {
        return this.prisma.account.findFirstOrThrow({ where: { id, userId } });
    }

    async update(id: string, userId: string, data: Prisma.AccountUpdateInput) {
        await this.findOneOrThrow(id, userId);
        return this.prisma.account.update({ where: { id }, data });
    }

    async remove(id: string, userId: string) {
        await this.findOneOrThrow(id, userId);
        return this.prisma.account.delete({ where: { id } });
    }
}
