import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUploadDto } from './dto/create-upload.dto';

@Injectable()
export class UploadsService {
    constructor(private prisma: PrismaService) {}

    findAll(userId: string) {
        return this.prisma.upload.findMany({ where: { userId } });
    }

    findOne(id: string, userId: string) {
        return this.prisma.upload.findFirstOrThrow({ where: { id, userId } });
    }

    create(userId: string, dto: CreateUploadDto) {
        return this.prisma.upload.create({ data: { userId, ...dto } });
    }

    remove(id: string, userId: string) {
        return this.prisma.upload.deleteMany({ where: { id, userId } });
    }
}