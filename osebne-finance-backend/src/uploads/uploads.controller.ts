import {
    Controller,
    Get,
    Post,
    Param,
    Delete,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Req,
    Res,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadsService } from './uploads.service';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { Response } from 'express';
import { multerConfig } from './multer.config';

@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
    constructor(private readonly uploads: UploadsService) {}

    @Post()
    @UseInterceptors(FileInterceptor('file', multerConfig))
    async create(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
        const u = await this.uploads.create(req.user.sub, {
            fileName: file.originalname,
            filePath: file.path,
            fileType: file.mimetype,
            fileSize: file.size,
        });
        return {
            id: u.id,
            file_name: u.fileName,
            file_type: u.fileType,
            file_size: u.file_size,
        };
    }

    @Get()
    async list(@Req() req: any) {
        return this.uploads.list(req.user.sub);
    }

    @Get(':id')
    async meta(@Param('id') id: string, @Req() req: any) {
        const u = await this.uploads.findById(Number(id));
        if (!u) throw new NotFoundException();
        if (u.userId !== req.user.sub) throw new ForbiddenException();
        return u;
    }

    @Get(':id/file')
    async file(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
        const u = await this.uploads.findById(Number(id));
        if (!u) throw new NotFoundException();
        if (u.userId !== req.user.sub) throw new ForbiddenException();

        const abs = join(process.cwd(), u.filePath);
        if (!existsSync(abs)) throw new NotFoundException();

        res.setHeader('Content-Type', u.fileType ?? 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${u.fileName}"`);
        return createReadStream(abs).pipe(res);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req: any) {
        const u = await this.uploads.findById(Number(id));
        if (!u) throw new NotFoundException();
        if (u.userId !== req.user.sub) throw new ForbiddenException();
        await this.uploads.remove(u.id);
        return { ok: true };
    }

    @Post(':uploadId/link/income/:incomeId')
    async linkIncome(@Param('uploadId') uploadId: string, @Param('incomeId') incomeId: string, @Req() req: any) {
        const u = await this.uploads.findById(Number(uploadId));
        if (!u) throw new NotFoundException();
        if (u.userId !== req.user.sub) throw new ForbiddenException();
        await this.uploads.linkToIncome(Number(uploadId), Number(incomeId));
        return { ok: true };
    }

    @Post(':uploadId/link/expense/:expenseId')
    async linkExpense(@Param('uploadId') uploadId: string, @Param('expenseId') expenseId: string, @Req() req: any) {
        const u = await this.uploads.findById(Number(uploadId));
        if (!u) throw new NotFoundException();
        if (u.userId !== req.user.sub) throw new ForbiddenException();
        await this.uploads.linkToExpense(Number(uploadId), Number(expenseId));
        return { ok: true };
    }
}
