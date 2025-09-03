import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FxService } from '../fx/fx.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {ListQueryDto} from "../common/dto/list-query.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class TransactionsService {
    constructor(private readonly prisma: PrismaService, private readonly fx: FxService) {}

    async create(userId: string, dto: CreateTransactionDto) {
        const baseCurrency = process.env.BASE_CURRENCY || 'EUR';
        const date = new Date(dto.date);

        return this.prisma.$transaction(async (tx) => {
            const t = await tx.transaction.create({
                data: { userId, date, description: dto.description, metadata: dto.metadata ?? {} },
            });

            for (const l of dto.lines) {
                const base = l.baseCurrency || baseCurrency;
                let rate = l.exchangeRate ?? null;

                if (!rate && l.currency !== base) {
                    const r = await this.fx.findRate(base, l.currency, date, tx as any);
                    rate = r?.rate ? Number(r.rate) : null;
                }

                const amountBase =
                    l.currency === base ? l.amount : rate ? Number((l.amount * rate).toFixed(2)) : null;

                await tx.transactionLine.create({
                    data: {
                        transactionId: t.id,
                        accountId: l.accountId,
                        categoryId: l.categoryId || null,
                        amount: l.amount,
                        currency: l.currency,
                        baseCurrency: base,
                        exchangeRate: rate,
                        amountBase,
                        description: l.description || null,
                    },
                });
            }

            return tx.transaction.findUnique({ where: { id: t.id }, include: { lines: true } });
        });
    }


    list(userId: string, q: ListQueryDto) {
        const skip = (q.page! - 1) * q.pageSize!;
        const take = q.pageSize!;
        const where: any = { userId };
        let orderBy: Prisma.TransactionOrderByWithRelationInput | undefined;
        if (q.sort) {
            orderBy = { [q.sort]: q.order } as Prisma.TransactionOrderByWithRelationInput;
        } else {
            orderBy = { date: 'desc' };
        }

        return this.prisma.transaction.findMany({ where, orderBy, skip, take });
    }


    get(userId: string, id: string) {
        return this.prisma.transaction.findFirstOrThrow({ where: { id, userId }, include: { lines: true } });
    }

    remove(userId: string, id: string) {
        return this.prisma.transaction.delete({ where: { id } });
    }
}
