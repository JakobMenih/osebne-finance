import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) {}

    findAll(userId: string) {
        return this.prisma.category.findMany({ where: { userId } });
    }

    findOne(id: string, userId: string) {
        return this.prisma.category.findFirstOrThrow({ where: { id, userId } });
    }

    create(userId: string, dto: CreateCategoryDto) {
        return this.prisma.category.create({ data: { userId, ...dto } });
    }

    async update(id: string, userId: string, dto: UpdateCategoryDto) {
        const updated = await this.prisma.category.updateMany({
            where: { id, userId },
            data: dto
        });
        if (updated.count === 0) throw new NotFoundException(`Category with id ${id} not found`);
        return this.prisma.category.findFirst({ where: { id, userId } });
    }

    remove(id: string, userId: string) {
        return this.prisma.category.deleteMany({ where: { id, userId } });
    }
}
