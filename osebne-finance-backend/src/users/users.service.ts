import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    async create(dto: CreateUserDto) {
        const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (exists) throw new ConflictException('Email already in use');
        const hash = await bcrypt.hash(dto.password, 10);
        return this.prisma.user.create({ data: { email: dto.email, passwordHash: hash, settings: {}, createdAt: new Date() } });
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }
}