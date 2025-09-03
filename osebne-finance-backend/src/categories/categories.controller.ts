import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { Prisma } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
    constructor(private readonly svc: CategoriesService) {}

    @Post()
    create(@Req() req, @Body() data: Prisma.CategoryCreateInput) {
        return this.svc.create(req.user.sub, data);
    }

    @Get()
    list(@Req() req) {
        return this.svc.all(req.user.sub);
    }

    @Patch(':id')
    update(@Req() req, @Param('id') id: string, @Body() data: Prisma.CategoryUpdateInput) {
        return this.svc.update(req.user.sub, id, data);
    }

    @Delete(':id')
    remove(@Req() req, @Param('id') id: string) {
        return this.svc.remove(req.user.sub, id);
    }
}
