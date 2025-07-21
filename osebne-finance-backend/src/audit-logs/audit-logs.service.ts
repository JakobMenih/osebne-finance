import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
    constructor(private prisma: PrismaService) {}

    findAll() {
        return this.prisma.auditLog.findMany();
    }

    findOne(id: string) {
        return this.prisma.auditLog.findUniqueOrThrow({ where: { id } });
    }
}