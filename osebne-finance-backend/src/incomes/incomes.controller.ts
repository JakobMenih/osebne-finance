import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IncomesService } from './incomes.service';

@UseGuards(JwtAuthGuard)
@Controller('incomes')
export class IncomesController {
    constructor(private readonly svc: IncomesService) {}

    @Get()
    list(
        @Req() req: any,
        @Query('categoryId') categoryId?: string,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        const userId = Number(req.user.sub);
        return this.svc.list(
            userId,
            categoryId ? Number(categoryId) : undefined,
            from ? new Date(from) : undefined,
            to ? new Date(to) : undefined,
        );
    }

    @Get(':id')
    get(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        const userId = Number(req.user.sub);
        return this.svc.getWithUploads(userId, id);
    }

    @Post()
    create(
        @Req() req: any,
        @Body() dto: { categoryId: number; amount: string; currency?: string; description?: string; transactionDate?: string; uploadIds?: number[] },
    ) {
        const userId = Number(req.user.sub);
        return this.svc.create(userId, {
            ...dto,
            transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : undefined,
        });
    }

    @Put(':id')
    update(
        @Req() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: { categoryId?: number; amount?: string; currency?: string; description?: string; transactionDate?: string; uploadIds?: number[] },
    ) {
        const userId = Number(req.user.sub);
        return this.svc.update(userId, id, {
            ...dto,
            transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : undefined,
        });
    }

    @Delete(':id')
    remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        const userId = Number(req.user.sub);
        return this.svc.remove(userId, id);
    }
}
