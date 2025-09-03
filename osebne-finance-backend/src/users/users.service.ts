import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    async findByEmail(email?: string) {
        if (!email) return null; // prepreči findUnique z undefined
        return this.prisma.user.findUnique({ where: { email } });
    }

    async findById(id: string) {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async create(email: string, password: string, firstName?: string, lastName?: string) {
        const passwordHash = await bcrypt.hash(password, 10);
        return this.prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName: firstName ?? null,
                lastName: lastName ?? null,
            },
            select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
        });
    }

    async update(id: string, data: { firstName?: string; lastName?: string; settings?: any; password?: string }) {
        const updateData: any = { ...data };
        if (data.password) {
            updateData.passwordHash = await bcrypt.hash(data.password, 10);
            delete updateData.password;
        }
        return this.prisma.user.update({ where: { id }, data: updateData });
    }
}
