import { Controller, Get, Post, Body, Param, Patch, Delete, Req, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
    constructor(private readonly svc: BudgetsService) {}

    @Get()
    getAll(@Req() req) {
        return this.svc.findAll(req.user.sub);
    }

    @Get(':id')
    getOne(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
        return this.svc.findOne(id, req.user.sub);
    }

    @Post()
    create(@Req() req, @Body() dto: CreateBudgetDto) {
        return this.svc.create(req.user.sub, dto);
    }

    @Patch(':id')
    update(@Req() req, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBudgetDto) {
        return this.svc.update(id, req.user.sub, dto);
    }

    @Delete(':id')
    remove(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
        return this.svc.remove(id, req.user.sub);
    }
}