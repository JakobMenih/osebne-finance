import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadsService } from './uploads.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
    constructor(private readonly svc: UploadsService) {}

    private static storage = diskStorage({
        destination: (_req, _f, cb) => cb(null, process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')),
        filename: (_req, file, cb) => cb(null, Date.now() + '_' + file.originalname),
    });

    // združljivo: POST /uploads
    @Post()
    @UseInterceptors(FileInterceptor('file', { storage: UploadsController.storage, limits: { fileSize: Number(process.env.MAX_UPLOAD_BYTES || 20 * 1024 * 1024) } }))
    uploadCompat(@Req() req, @UploadedFile() file: Express.Multer.File, @Body() body: { source?: string }) {
        if (!file) throw new NotFoundException('Datoteka ni priložena');
        const metadata = { originalname: file.originalname, mimetype: file.mimetype, size: file.size, filename: file.filename, path: file.path };
        return this.svc.create(req.user.sub, body?.source || null, metadata);
    }

    // tvoja pot: POST /uploads/file
    @Post('file')
    @UseInterceptors(FileInterceptor('file', { storage: UploadsController.storage, limits: { fileSize: Number(process.env.MAX_UPLOAD_BYTES || 20 * 1024 * 1024) } }))
    uploadFile(@Req() req, @UploadedFile() file: Express.Multer.File, @Body() body: { source?: string }) {
        if (!file) throw new NotFoundException('Datoteka ni priložena');
        const metadata = { originalname: file.originalname, mimetype: file.mimetype, size: file.size, filename: file.filename, path: file.path };
        return this.svc.create(req.user.sub, body?.source || null, metadata);
    }

    @Get()
    list(@Req() req) {
        return this.svc.list(req.user.sub);
    }

    @Get(':id/download')
    async download(@Param('id') id: string, @Res() res: Response) {
        const up: any = await this.svc.findById(id);
        if (!up) throw new NotFoundException();
        const p: string | undefined = up?.fileMetadata?.path;
        const name: string = up?.fileMetadata?.originalname || 'download';
        if (!p || !fs.existsSync(p)) throw new NotFoundException('Datoteka ne obstaja');
        return res.download(p, name);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        const out = await this.svc.remove(id);
        if (!out) throw new NotFoundException();
        return out;
    }

    @Post(':uploadId/link/transaction/:transactionId')
    linkTx(@Param('uploadId') uploadId: string, @Param('transactionId') transactionId: string) {
        return this.svc.linkToTransaction(uploadId, transactionId);
    }

    @Post(':uploadId/link/line/:lineId')
    linkLine(@Param('uploadId') uploadId: string, @Param('lineId') lineId: string) {
        return this.svc.linkToLine(uploadId, lineId);
    }
}
