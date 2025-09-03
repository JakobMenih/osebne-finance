import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { FxService } from './fx.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('fx')
export class FxController {
    constructor(private readonly svc: FxService) {}

    @Post()
    upsert(@Body() body: { base: string; quote: string; rate: number; rateDate: string; source?: string }) {
        return this.svc.upsert(body.base, body.quote, body.rate, new Date(body.rateDate), body.source);
    }

    @Get()
    list() {
        return this.svc.list();
    }
}
