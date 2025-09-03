import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {PrismaService} from "../prisma/prisma.service";
import {CreateBudgetDto} from "./dto/create-budget.dto";

@Injectable()
export class BudgetsService {
    constructor(private readonly prisma: PrismaService) {}

    findAll(userId: string) {
        return this.prisma.budget.findMany({ where: { userId } });
    }

    findOne(id: string, userId: string) {
        return this.prisma.budget.findFirst({ where: { id, userId } });
    }

    async create(userId: string, dto: CreateBudgetDto) {
        return this.prisma.budget.create({
            data: {
                user: { connect: { id: userId } },
                category: { connect: { id: dto.categoryId } },
                periodStart: new Date(dto.periodStart),  // <—
                periodEnd: new Date(dto.periodEnd),      // <—
                amount: dto.amount,
                metadata: dto.metadata ?? undefined,
            },
        });
    }

    update(id: string, userId: string, data: Prisma.BudgetUpdateInput) {
        return this.prisma.budget.updateMany({ where: { id, userId }, data });
    }

    remove(id: string, userId: string) {
        return this.prisma.budget.deleteMany({ where: { id, userId } });
    }
}
