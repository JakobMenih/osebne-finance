import { Injectable, NotFoundException } from '@nestjs/common';
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

    create(userId: string, dto: CreateBudgetDto) {
        return this.prisma.budget.create({ data: { userId, ...dto } });
    }

    async update(id: string, userId: string, dto: UpdateBudgetDto) {
        const updated = await this.prisma.budget.updateMany({
            where: { id, userId },
            data: dto
        });
        if (updated.count === 0) throw new NotFoundException(`Budget with id ${id} not found`);
        return this.prisma.budget.findFirst({ where: { id, userId } });
    }

    remove(id: string, userId: string) {
        return this.prisma.budget.deleteMany({ where: { id, userId } });
    }
}
