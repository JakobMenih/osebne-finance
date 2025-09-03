import { Injectable } from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service";

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    create(data: { email: string; passwordHash: string }) {
        return this.prisma.user.create({ data });
    }

    findOne(id: string) {
        return this.prisma.user.findUnique({ where: { id } });
    }

    findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }
}
