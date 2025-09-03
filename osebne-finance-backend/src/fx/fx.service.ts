import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FxService {
    constructor(private readonly prisma: PrismaService) {}

    upsert(base: string, quote: string, rate: number, rateDate: Date, source?: string) {
        return this.prisma.fxRate.upsert({
            where: { base_quote_rateDate: { base, quote, rateDate } },
            create: { base, quote, rate, rateDate, source: source || null },
            update: { rate, source: source || null },
        });
    }

    findRate(
        base: string,
        quote: string,
        date: Date,
        prisma?: Prisma.TransactionClient | PrismaService,
    ) {
        const p = (prisma as any) ?? this.prisma;
        return p.fxRate.findFirst({
            where: { base, quote, rateDate: { lte: date as any } },
            orderBy: { rateDate: 'desc' },
        });
    }

    list() {
        return this.prisma.fxRate.findMany({
            orderBy: [{ base: 'asc' }, { quote: 'asc' }, { rateDate: 'desc' }],
        });
    }
}
