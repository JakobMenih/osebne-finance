import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import {CreateCategoryDto} from "./dto/create-category.dto";
import {UpdateCategoryDto} from "./dto/update-category.dto";


@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categories: CategoriesService) {}

    @Get()
    list(@Req() req: any) {
        const userId = Number(req.user.sub);
        return this.categories.list(userId);
    }

    @Post()
    create(@Req() req: any, @Body() dto: CreateCategoryDto) {
        const userId = Number(req.user.sub);
        return this.categories.create(userId, dto);
    }

    @Put(':id')
    update(
        @Req() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCategoryDto,
    ) {
        const userId = Number(req.user.sub);
        return this.categories.update(userId, id, dto);
    }

    @Delete(':id')
    remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        const userId = Number(req.user.sub);
        return this.categories.remove(userId, id);
    }
}
