import { Controller, Get, Post, Body, Param, Patch, Delete, Req, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
    constructor(private readonly svc: TransactionsService) {}

    @Get()
    getAll(@Req() req) {
        return this.svc.findAll(req.user.sub);
    }

    @Get(':id')
    getOne(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
        return this.svc.findOne(id, req.user.sub);
    }

    @Post()
    create(@Req() req, @Body() dto: CreateTransactionDto) {
        return this.svc.create(req.user.sub, dto);
    }

    @Patch(':id')
    update(@Req() req, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTransactionDto) {
        return this.svc.update(id, req.user.sub, dto);
    }

    @Delete(':id')
    remove(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
        return this.svc.remove(id, req.user.sub);
    }
}
