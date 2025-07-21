import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { Account as AccountModel, Prisma } from '@prisma/client';

@Controller('accounts')
export class AccountsController {
    constructor(private readonly accountsService: AccountsService) {}

    @Post()
    create(@Body() data: Prisma.AccountCreateInput): Promise<AccountModel> {
        return this.accountsService.create(data);
    }

    @Get()
    findAll(): Promise<AccountModel[]> {
        return this.accountsService.findAll();
    }

    @Get(':id')
    findOne(
        @Param('id') id: string
    ): Promise<AccountModel> {
        return this.accountsService.findOneOrThrow(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: Prisma.AccountUpdateInput): Promise<AccountModel> {
        return this.accountsService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<AccountModel> {
        return this.accountsService.remove(id);
    }
}
