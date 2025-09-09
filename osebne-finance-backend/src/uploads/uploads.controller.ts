import {
    Controller, Get, Post, Delete, Param, Body, Req, UseGuards, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadsService } from './uploads.service';
import {CreateUploadDto} from "./dto/create-upload.dto";

@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
    constructor(private readonly svc: UploadsService) {}

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async create(@Req() req: any, @UploadedFile() file: Express.Multer.File, @Body() _body: CreateUploadDto) {
        if (!file) throw new BadRequestException('Datoteka je obvezna (field name: "file")');

        const userId = Number(req.user?.sub);
        const f: any = file as any;
        const filePath = f.path ?? (f.destination && f.filename ? path.join(f.destination, f.filename) : null);
        if (!filePath) throw new BadRequestException('Ni mogoče določiti poti datoteke.');

        return this.svc.create(userId, {
            fileName: file.originalname,
            filePath,
            fileType: file.mimetype,
            fileSize: file.size,
        });
    }

    @Get()
    list(@Req() req: any) {
        const userId = Number(req.user?.sub);
        return this.svc.list(userId);
    }

    @Get(':id')
    get(@Param('id') id: string) {
        return this.svc.findById(Number(id));
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.svc.remove(Number(id));
    }

    @Post(':uploadId/link/income/:incomeId')
    linkIncome(@Param('uploadId') uploadId: string, @Param('incomeId') incomeId: string) {
        return this.svc.linkToIncome(Number(uploadId), Number(incomeId));
    }

    @Post(':uploadId/link/expense/:expenseId')
    linkExpense(@Param('uploadId') uploadId: string, @Param('expenseId') expenseId: string) {
        return this.svc.linkToExpense(Number(uploadId), Number(expenseId));
    }
}
