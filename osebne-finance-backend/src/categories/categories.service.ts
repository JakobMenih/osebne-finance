import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) {}

    findAll(userId: string) {
        return this.prisma.category.findMany({
            where: { userId },
            include: { children: true },
        });
    }

    findOne(id: string, userId: string) {
        return this.prisma.category.findFirstOrThrow({
            where: { id, userId },
            include: { children: true },
        });
    }

    create(userId: string, dto: CreateCategoryDto) {
        return this.prisma.category.create({
            data: { userId, ...dto },
        });
    }

    update(id: string, userId: string, dto: UpdateCategoryDto) {
        return this.prisma.category.updateMany({
            where: { id, userId },
            data: dto,
        });
    }

    remove(id: string, userId: string) {
        return this.prisma.category.deleteMany({
            where: { id, userId },
        });
    }
}
