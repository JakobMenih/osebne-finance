import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AllocationsService } from './allocations.service';

@UseGuards(JwtAuthGuard)
@Controller('allocations')
export class AllocationsController {
    constructor(private readonly svc: AllocationsService) {}

    @Post()
    create(@Req() req, @Body() body: { accountId?: string; categoryId: string; amount: number; currency: string; note?: string }) {
        return this.svc.create(req.user.sub, body);
    }

    @Get()
    list(@Req() req) {
        return this.svc.list(req.user.sub);
    }
}
