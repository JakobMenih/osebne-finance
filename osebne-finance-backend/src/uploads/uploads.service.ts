import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUploadDto } from './dto/create-upload.dto';

@Injectable()
export class UploadsService {
    constructor(private readonly prisma: PrismaService) {}

    create(userId: string, dto: CreateUploadDto) {
        return this.prisma.upload.create({
            data: {
                user: { connect: { id: userId } },
                source: dto?.source ?? null,
                fileMetadata: dto?.fileMetadata ?? {},
            },
        });
    }

    createFromFile(userId: string, file: Express.Multer.File, source = 'upload') {
        const metadata = {
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: (file as any).path,
        } as any;

        return this.prisma.upload.create({
            data: {
                user: { connect: { id: userId } },
                source,
                fileMetadata: metadata,
            },
        });
    }

    findAllByUser(userId: string) {
        return this.prisma.upload.findMany({ where: { userId } });
    }

    findOneForUser(id: string, userId: string) {
        return this.prisma.upload.findFirst({ where: { id, userId } });
    }

    async remove(id: string, userId: string) {
        await this.findOneForUser(id, userId);
        return this.prisma.upload.delete({ where: { id } });
    }
}
