import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BudgetsService } from './budgets.service';
import { Prisma } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
    constructor(private readonly svc: BudgetsService) {}

    @Post()
    upsert(@Req() req, @Body() data: Prisma.BudgetUncheckedCreateInput) {
        return this.svc.upsert(req.user.sub, data);
    }

    @Get()
    list(@Req() req) {
        return this.svc.list(req.user.sub);
    }
}
