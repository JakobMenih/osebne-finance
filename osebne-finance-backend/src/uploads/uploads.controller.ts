import { Controller, Post, Get, Delete, Param, Body, UploadedFile, UseInterceptors, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
    constructor(private readonly uploads: UploadsService, private readonly cfg: ConfigService) {}

    @Post('file')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const dir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'var', 'uploads');
                try { fs.mkdirSync(dir, { recursive: true }); } catch {}
                cb(null, dir);
            },
            filename: (req, file, cb) => {
                const ext = path.extname(file.originalname || '').toLowerCase() || '.bin';
                cb(null, `${crypto.randomUUID()}${ext}`);
            },
        }),
        limits: { fileSize: Number(process.env.MAX_UPLOAD_BYTES ?? 5 * 1024 * 1024) },
        fileFilter: (req, file, cb) => {
            const okMime = /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/i.test(file.mimetype || '');
            const okExt  = /\.(jpe?g|png|webp|gif|pdf)$/i.test((file.originalname || '').toLowerCase());
            cb(okMime || okExt ? null : new BadRequestException('Napačen tip datoteke'), okMime || okExt);
        },
    }))
    async upload(@UploadedFile() file: Express.Multer.File, @Body('source') source: string, @Req() req: any) {
        if (!file) throw new BadRequestException('Datoteka je obvezna');
        const userId = req.user.sub as string;
        return this.uploads.createFromFile(userId, file, source ?? 'upload');
    }

    @Get()
    findAll(@Req() req: any) {
        return this.uploads.findAllByUser(req.user.sub);
    }

    @Get(':id/download')
    download(@Param('id') id: string, @Req() req: any) {
        return this.uploads.findOneForUser(id, req.user.sub);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Req() req: any) {
        return this.uploads.remove(id, req.user.sub);
    }
}
