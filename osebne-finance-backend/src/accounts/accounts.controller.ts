import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { Prisma, Account } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
    constructor(private readonly svc: AccountsService) {}

    @Post()
    create(@Req() req, @Body() data: Omit<Prisma.AccountCreateInput, 'user'>) {
        return this.svc.create(req.user.sub, data);
    }

    @Get()
    findAll(@Req() req) {
        return this.svc.findAll(req.user.sub);
    }

    @Get(':id')
    findOne(@Req() req, @Param('id', ParseUUIDPipe) id: string): Promise<Account> {
        return this.svc.findOneOrThrow(id, req.user.sub);
    }

    @Patch(':id')
    update(@Req() req, @Param('id', ParseUUIDPipe) id: string, @Body() data: Prisma.AccountUpdateInput) {
        return this.svc.update(id, req.user.sub, data);
    }

    @Delete(':id')
    remove(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
        return this.svc.remove(id, req.user.sub);
    }
}
