import {Injectable, NotFoundException} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Account, Prisma } from '@prisma/client';

@Injectable()
export class AccountsService {
    constructor(private prisma: PrismaService) {}

    create(data: Prisma.AccountCreateInput): Promise<Account> {
        return this.prisma.account.create({ data });
    }

    findAll(): Promise<Account[]> {
        return this.prisma.account.findMany();
    }

    async findOneOrThrow(id: string): Promise<Account> {
        const account = await this.prisma.account.findUnique({ where: { id } });
        if (!account) throw new NotFoundException(`Account with id ${id} not found`);
        return account;
    }

    update(id: string, data: Prisma.AccountUpdateInput): Promise<Account> {
        return this.prisma.account.update({ where: { id }, data });
    }

    remove(id: string): Promise<Account> {
        return this.prisma.account.delete({ where: { id } });
    }

}
