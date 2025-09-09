import {
    BadRequestException, Body, Controller, ForbiddenException, Get,
    Param, Patch, Post, Req, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import * as bcrypt from 'bcryptjs';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly users: UsersService) {}

    @Get(':id')
    async getUser(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        if (req.user.sub !== id) throw new ForbiddenException();
        const user = await this.users.findById(id);
        if (!user) throw new BadRequestException('Uporabnik ne obstaja');
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            defaultCurrency: user.defaultCurrency,
            showAmounts: user.showAmounts,
            createdAt: user.createdAt,
        };
    }

    @Patch(':id')
    async updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any,
        @Body() body: { firstName?: string; lastName?: string; defaultCurrency?: string; showAmounts?: boolean },
    ) {
        if (req.user.sub !== id) throw new ForbiddenException();
        const user = await this.users.findById(id);
        if (!user) throw new BadRequestException('Uporabnik ne obstaja');
        return this.users.updateProfile(id, body);
    }

    @Post(':id/change-password')
    async changePassword(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any,
        @Body() body: { oldPassword?: string; newPassword?: string }
    ) {
        if (req.user.sub !== id) throw new ForbiddenException();
        const { oldPassword, newPassword } = body ?? {};
        if (!oldPassword || !newPassword) {
            throw new BadRequestException('Manjka staro ali novo geslo');
        }
        const user = await this.users.findById(id);
        if (!user) throw new BadRequestException('Uporabnik ne obstaja');
        const ok = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!ok) throw new ForbiddenException('Napačno staro geslo');

        await this.users.updatePassword(id, newPassword);
        return { ok: true };
    }
}
