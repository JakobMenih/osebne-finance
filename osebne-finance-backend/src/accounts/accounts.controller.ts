import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { Prisma, Account } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
    constructor(private readonly accountsService: AccountsService) {}

    @Post()
    create(@Req() req, @Body() data: Omit<Prisma.AccountCreateInput, 'user'>) {
        return this.accountsService.create(req.user.sub, data);
    }

    @Get()
    findAll(@Req() req): Promise<Account[]> {
        return this.accountsService.findAll(req.user.sub);
    }

    @Get(':id')
    findOne(@Req() req, @Param('id', ParseUUIDPipe) id: string): Promise<Account> {
        return this.accountsService.findOneOrThrow(id, req.user.sub);
    }

    @Patch(':id')
    update(@Req() req, @Param('id', ParseUUIDPipe) id: string, @Body() data: Prisma.AccountUpdateInput): Promise<Account> {
        return this.accountsService.update(id, req.user.sub, data);
    }

    @Delete(':id')
    remove(@Req() req, @Param('id', ParseUUIDPipe) id: string): Promise<Account> {
        return this.accountsService.remove(id, req.user.sub);
    }
}
