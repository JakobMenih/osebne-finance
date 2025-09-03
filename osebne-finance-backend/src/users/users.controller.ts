import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    async create(@Body() dto: CreateUserDto) {
        const passwordHash = await bcrypt.hash(dto.password, 10);
        return this.usersService.create({ email: dto.email, passwordHash });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    update() {
        return { count: 0 };
    }

    @Delete(':id')
    remove() {
        return { count: 0 };
    }
}
