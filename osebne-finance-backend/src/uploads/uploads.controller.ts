import { Controller, Get, Post, Body, Param, Delete, Req, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadsService } from './uploads.service';
import { CreateUploadDto } from './dto/create-upload.dto';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
    constructor(private readonly svc: UploadsService) {}

    @Get()
    getAll(@Req() req) {
        return this.svc.findAll(req.user.sub);
    }

    @Get(':id')
    getOne(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
        return this.svc.findOne(id, req.user.sub);
    }

    @Post()
    create(@Req() req, @Body() dto: CreateUploadDto) {
        return this.svc.create(req.user.sub, dto);
    }

    @Delete(':id')
    remove(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
        return this.svc.remove(id, req.user.sub);
    }
}
