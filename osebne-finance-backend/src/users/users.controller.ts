import {
    BadRequestException,
    Body,
    Controller,
    ForbiddenException,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import * as bcrypt from 'bcryptjs';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly users: UsersService) {}

    @Get(':id')
    async getUser(@Param('id') id: string, @Req() req: any) {
        if (req.user.sub !== id) throw new ForbiddenException();
        const user: any = await this.users.findById(id);
        if (!user) throw new BadRequestException('Uporabnik ne obstaja');
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            settings: user.settings ?? {},
            createdAt: user.createdAt,
        };
    }

    @Patch(':id')
    async updateUser(
        @Param('id') id: string,
        @Req() req: any,
        @Body() body: { firstName?: string; lastName?: string; settings?: any }
    ) {
        if (req.user.sub !== id) throw new ForbiddenException();
        const user = await this.users.findById(id);
        if (!user) throw new BadRequestException('Uporabnik ne obstaja');
        return this.users.update(id, {
            firstName: body.firstName,
            lastName: body.lastName,
            settings: body.settings,
        });
    }

    @Post(':id/change-password')
    async changePassword(
        @Param('id') id: string,
        @Req() req: any,
        @Body() body: { oldPassword?: string; newPassword?: string }
    ) {
        if (req.user.sub !== id) throw new ForbiddenException();
        const { oldPassword, newPassword } = body ?? {};
        if (!oldPassword || !newPassword) {
            throw new BadRequestException('Manjka staro ali novo geslo');
        }

        const user: any = await this.users.findById(id);
        if (!user) throw new BadRequestException('Uporabnik ne obstaja');

        const ok = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!ok) throw new ForbiddenException('Napačno staro geslo');

        await this.users.update(id, { password: newPassword });
        return { ok: true };
    }
}
