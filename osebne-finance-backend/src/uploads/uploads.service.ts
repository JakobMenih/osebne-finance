import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';

@Injectable()
export class UploadsService {
    constructor(private readonly prisma: PrismaService) {}

    create(userId: string, source: string | null, fileMetadata: any) {
        return this.prisma.upload.create({ data: { userId, source, fileMetadata } });
    }

    list(userId: string) {
        return this.prisma.upload.findMany({ where: { userId } });
    }

    findById(id: string) {
        return this.prisma.upload.findUnique({ where: { id } });
    }

    async remove(id: string) {
        const up: any = await this.prisma.upload.findUnique({ where: { id } });
        if (!up) return null;
        const p: string | undefined = up?.fileMetadata?.path;
        try {
            if (p && fs.existsSync(p)) fs.unlinkSync(p);
        } catch { }
        return this.prisma.upload.delete({ where: { id } });
    }

    linkToTransaction(uploadId: string, transactionId: string) {
        return this.prisma.uploadLink.create({ data: { uploadId, transactionId } });
    }

    linkToLine(uploadId: string, lineId: string) {
        return this.prisma.uploadLink.create({ data: { uploadId, lineId } });
    }
}
