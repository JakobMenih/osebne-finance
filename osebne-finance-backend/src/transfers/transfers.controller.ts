import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
