import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
    constructor(private readonly svc: ExpensesService) {}

    @Get()
    list(@Req() req: any, @Query('categoryId') categoryId?: string, @Query('from') from?: string, @Query('to') to?: string) {
        const userId = Number(req.user.sub);
        return this.svc.list(
            userId,
            categoryId ? Number(categoryId) : undefined,
            from ? new Date(from) : undefined,
            to ? new Date(to) : undefined,
        );
    }

    @Get(':id')
    getOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        return this.svc.getWithUploads(Number(req.user.sub), id);
    }

    @Post()
    create(@Req() req: any, @Body() body: any) {
        return this.svc.create(Number(req.user.sub), body);
    }

    @Put(':id')
    update(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
        return this.svc.update(Number(req.user.sub), id, body);
    }

    @Delete(':id')
    remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        return this.svc.remove(Number(req.user.sub), id);
    }
}
