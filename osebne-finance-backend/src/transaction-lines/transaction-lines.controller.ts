import { Controller, Get, Post, Body, Param, Patch, Delete, Req, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionLinesService } from './transaction-lines.service';
import { CreateTransactionLineDto } from './dto/create-transaction-line.dto';
import { UpdateTransactionLineDto } from './dto/update-transaction-line.dto';

@Controller('transaction-lines')
@UseGuards(JwtAuthGuard)
export class TransactionLinesController {
    constructor(private readonly svc: TransactionLinesService) {}

    @Get(':transactionId')
    getAll(@Req() req, @Param('transactionId', ParseUUIDPipe) transactionId: string) {
        return this.svc.findAll(transactionId, req.user.sub);
    }

    @Get('line/:id')
    getOne(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
        return this.svc.findOne(id, req.user.sub);
    }

    @Post()
    create(@Req() req, @Body() dto: CreateTransactionLineDto) {
        return this.svc.create(req.user.sub, dto);
    }

    @Patch(':id')
    update(@Req() req, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTransactionLineDto) {
        return this.svc.update(id, req.user.sub, dto);
    }

    @Delete(':id')
    remove(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
        return this.svc.remove(id, req.user.sub);
    }
}
