import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Patch,
    Delete,
    Req,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
    constructor(private readonly svc: CategoriesService) {}

    @Get()
    getAll(@Req() req) {
        return this.svc.findAll(req.user.sub);
    }

    @Get(':id')
    getOne(
        @Req() req,
        @Param('id', ParseUUIDPipe) id: string
    ) {
        return this.svc.findOne(id, req.user.sub);
    }

    @Post()
    create(@Req() req, @Body() dto: CreateCategoryDto) {
        return this.svc.create(req.user.sub, dto);
    }

    @Patch(':id')
    update(
        @Req() req,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateCategoryDto
    ) {
        return this.svc.update(id, req.user.sub, dto);
    }

    @Delete(':id')
    remove(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
        return this.svc.remove(id, req.user.sub);
    }
}
