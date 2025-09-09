import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) {}

    list(userId: number) {
        return this.prisma.category.findMany({
            where: { userId },
            orderBy: [{ name: 'asc' }],
        });
    }

    create(userId: number, dto: CreateCategoryDto) {
        return this.prisma.category.create({
            data: {
                userId,
                name: dto.name,
                description: dto.description ?? null,
                isDefault: dto.isDefault ?? false,
            },
        });
    }

    update(userId: number, id: number, dto: UpdateCategoryDto) {
        return this.prisma.category.update({
            where: { id },
            data: {
                ...(dto.name !== undefined ? { name: dto.name } : {}),
                ...(dto.description !== undefined ? { description: dto.description } : {}),
                ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
            },
        });
    }

    remove(userId: number, id: number) {
        return this.prisma.category.delete({ where: { id } });
    }
}
