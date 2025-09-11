import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UploadsService {
    constructor(private prisma: PrismaService) {}

    create(
        userId: number,
        data: { fileName: string; filePath: string; fileType?: string; fileSize?: number; checksum?: string },
    ) {
        return this.prisma.upload.create({
            data: {
                userId,
                fileName: data.fileName,
                filePath: data.filePath,
                fileType: data.fileType ?? null,
                file_size: data.fileSize ?? null,
                checksum: data.checksum ?? null,
            },
        });
    }

    list(userId: number) {
        return this.prisma.upload.findMany({ where: { userId } });
    }

    findById(id: number) {
        return this.prisma.upload.findUnique({ where: { id } });
    }

    async remove(id: number) {
        await this.prisma.incomeUpload.deleteMany({ where: { upload_id: id } });
        await this.prisma.expenseUpload.deleteMany({ where: { upload_id: id } });
        return this.prisma.upload.delete({ where: { id } });
    }

    linkToIncome(uploadId: number, incomeId: number) {
        return this.prisma.incomeUpload.create({
            data: { upload_id: uploadId, income_id: incomeId },
        });
    }

    linkToExpense(uploadId: number, expenseId: number) {
        return this.prisma.expenseUpload.create({
            data: { upload_id: uploadId, expense_id: expenseId },
        });
    }
}
