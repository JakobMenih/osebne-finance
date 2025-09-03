import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';

const allowed = ['expense', 'income', 'transfer'] as const;
type CatType = typeof allowed[number];

function normType(v: string): CatType {
    const t = (v ?? '').toString().toLowerCase();
    if (!allowed.includes(t as CatType)) throw new BadRequestException('Neveljaven type za kategorijo');
    return t as CatType;
}

@Injectable()
export class CategoriesService {
    constructor(private readonly prisma: PrismaService) {}

    findAll(userId: string) {
        return this.prisma.category.findMany({ where: { userId } });
    }

    findOne(id: string, userId: string) {
        return this.prisma.category.findFirst({ where: { id, userId } });
    }

    create(userId: string, dto: CreateCategoryDto) {
        return this.prisma.category.create({
            data: {
                name: dto.name,
                type: normType(dto.type),
                parentId: dto.parentId ?? null,
                userId: userId,
            },
        });
    }

    async update(id: string, userId: string, dto: UpdateCategoryDto) {
        const data: any = {};
        if (dto.name !== undefined) data.name = dto.name;
        if (dto.type !== undefined) data.type = normType(dto.type as any);
        if (dto.parentId !== undefined) data.parentId = dto.parentId;

        const res = await this.prisma.category.updateMany({
            where: { id, userId },
            data,
        });
        return { count: res.count };
    }

    async remove(id: string, userId: string) {
        const res = await this.prisma.category.deleteMany({ where: { id, userId } });
        return { count: res.count };
    }
}
