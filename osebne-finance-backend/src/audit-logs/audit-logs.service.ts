import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
    constructor(private prisma: PrismaService) {}

    findAll(userId: string) {
        return this.prisma.auditLog.findMany({ where: { userId } });
    }

    findOne(id: string, userId: string) {
        return this.prisma.auditLog.findFirstOrThrow({ where: { id, userId } });
    }
}
