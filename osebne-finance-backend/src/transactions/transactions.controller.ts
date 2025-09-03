import {Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {ListQueryDto} from "../common/dto/list-query.dto";

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
    constructor(private readonly svc: TransactionsService) {}

    @Post()
    create(@Req() req, @Body() dto: CreateTransactionDto) {
        return this.svc.create(req.user.sub, dto);
    }

    @Get()
    list(@Req() req: any, @Query() q: ListQueryDto) {
        return this.svc.list(req.user.sub, q);
    }

    @Get(':id')
    get(@Req() req, @Param('id') id: string) {
        return this.svc.get(req.user.sub, id);
    }

    @Delete(':id')
    remove(@Req() req, @Param('id') id: string) {
        return this.svc.remove(req.user.sub, id);
    }
}
