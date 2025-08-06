import {ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
    constructor(private prisma: PrismaService) {}

    findAll(userId: string) {
        return this.prisma.budget.findMany({ where: { userId } });
    }

    findOne(id: string, userId: string) {
        return this.prisma.budget.findFirstOrThrow({ where: { id, userId } });
    }

    async create(userId: string, dto: CreateBudgetDto) {
        try {
            return await this.prisma.budget.create({
                data: { userId, ...dto },
            });
        } catch (e: any) {
            // Postgres unique‐violation code is 'P2002' in Prisma
            if (e.code === 'P2002' && e.meta?.target?.includes('userId_categoryId_periodStart')) {
                throw new ConflictException('You already have a budget for that category and period');
            }
            throw e;
        }
    }

    async update(id: string, userId: string, dto: UpdateBudgetDto) {
        const updated = await this.prisma.budget.updateMany({
            where: { id, userId },
            data: dto
        });
        if (updated.count === 0) throw new NotFoundException(`Budget with id ${id} not found`);
        return this.prisma.budget.findFirst({ where: { id, userId } });
    }

    async remove(id: string, userId: string) {
        const { count } = await this.prisma.budget.deleteMany({
            where: { id, userId },
        });
        if (count === 0) {
            throw new NotFoundException(`Budget with id ${id} not found`);
        }
        return { success: true };
    }
}
