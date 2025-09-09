import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    findById(id: number) {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async create(email: string, password: string, firstName = '', lastName = '') {
        const passwordHash = await bcrypt.hash(password, 10);
        return this.prisma.user.create({
            data: { email, passwordHash, firstName, lastName },
        });
    }

    updateProfile(id: number, data: { firstName?: string; lastName?: string; defaultCurrency?: string; showAmounts?: boolean }) {
        return this.prisma.user.update({
            where: { id },
            data: {
                ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
                ...(data.lastName  !== undefined ? { lastName: data.lastName } : {}),
                ...(data.defaultCurrency ? { defaultCurrency: data.defaultCurrency.toUpperCase() } : {}),
                ...(data.showAmounts !== undefined ? { showAmounts: data.showAmounts } : {}),
            },
        });
    }

    async updatePassword(id: number, newPassword: string) {
        const passwordHash = await bcrypt.hash(newPassword, 10);
        return this.prisma.user.update({ where: { id }, data: { passwordHash } });
    }
}
