import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionLinesService } from './transaction-lines.service';
import { CreateTransactionLineDto } from './dto/create-transaction-line.dto';
import { UpdateTransactionLineDto } from './dto/update-transaction-line.dto';

@Controller('transaction-lines')
@UseGuards(JwtAuthGuard)
export class TransactionLinesController {
    constructor(private readonly svc: TransactionLinesService) {}

    @Get(':transactionId')
    getAll(@Param('transactionId', ParseUUIDPipe) txId: string) {
        return this.svc.findAll(txId);
    }

    @Get('line/:id')
    getOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.svc.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateTransactionLineDto) {
        return this.svc.create(dto);
    }

    @Patch(':id')
    update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTransactionLineDto) {
        return this.svc.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.svc.remove(id);
    }
}