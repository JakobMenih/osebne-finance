import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransfersService } from './transfers.service';

@UseGuards(JwtAuthGuard)
@Controller('transfers')
export class TransfersController {
    constructor(private readonly svc: TransfersService) {}

    @Get()
    list(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) {
        const userId = Number(req.user.sub);
        return this.svc.list(userId, from ? new Date(from) : undefined, to ? new Date(to) : undefined);
    }

    @Post()
    create(
        @Req() req: any,
        @Body() dto: { fromCategoryId: number; toCategoryId: number; amount: string; currency?: string; description?: string; transferDate?: string },
    ) {
        const userId = Number(req.user.sub);
        return this.svc.create(userId, {
            ...dto,
            transferDate: dto.transferDate ? new Date(dto.transferDate) : undefined,
        });
    }

    @Put(':id')
    update(
        @Req() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: { fromCategoryId?: number; toCategoryId?: number; amount?: string; currency?: string; description?: string; transferDate?: string },
    ) {
        const userId = Number(req.user.sub);
        return this.svc.update(userId, id, {
            ...dto,
            transferDate: dto.transferDate ? new Date(dto.transferDate) : undefined,
        });
    }

    @Delete(':id')
    remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        const userId = Number(req.user.sub);
        return this.svc.remove(userId, id);
    }
}
