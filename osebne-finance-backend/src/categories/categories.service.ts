import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
    constructor(private readonly prisma: PrismaService) {}

    create(userId: string, data: Prisma.CategoryCreateInput) {
        const { name, type, parent } = data;
        return this.prisma.category.create({
            data: {
                name,
                type,
                user: { connect: { id: userId } },
                parent: parent ? { connect: { id: (parent as any).connect.id } } : undefined,
            },
        });
    }

    all(userId: string) {
        return this.prisma.category.findMany({ where: { userId } });
    }

    update(userId: string, id: string, data: Prisma.CategoryUpdateInput) {
        return this.prisma.category.update({ where: { id }, data, include: { children: true } });
    }

    remove(userId: string, id: string) {
        return this.prisma.category.delete({ where: { id } });
    }
}
