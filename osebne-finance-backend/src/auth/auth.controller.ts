import { BadRequestException, Body, Controller, Post, Put, UnauthorizedException, UseGuards, Req, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import * as bcrypt from 'bcryptjs';

@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService, private readonly users: UsersService) {}

    @Post('register')
    async register(@Body() body: { email?: string; password?: string; firstName?: string; lastName?: string }) {
        const { email, password, firstName, lastName } = body ?? {};
        if (!email || !password) throw new BadRequestException('email and password required');
        const exists = await this.users.findByEmail(email);
        if (exists) throw new BadRequestException('email already in use');
        return this.users.create(email, password, firstName, lastName);
    }

    @Post('login')
    @HttpCode(200)
    async login(@Body() body: { email?: string; password?: string }) {
        const user = await this.auth.validateUser(body?.email, body?.password);
        if (!user) throw new UnauthorizedException();
        return this.auth.login(user);
    }

    @UseGuards(JwtAuthGuard)
    @Post('profile')
    @HttpCode(200)
    async profile(@Req() req: any) {
        const user = await this.users.findById(Number(req.user?.sub));
        if (!user) throw new UnauthorizedException();
        return {
            userId: user.id,
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            defaultCurrency: user.defaultCurrency,
            showAmounts: user.showAmounts,
            createdAt: user.createdAt
        };
    }

    @UseGuards(JwtAuthGuard)
    @Put('profile')
    async updateProfile(
        @Req() req: any,
        @Body() dto: { firstName?: string; lastName?: string; defaultCurrency?: string; showAmounts?: boolean }
    ) {
        const userId = Number(req.user?.sub);
        const u = await this.users.updateProfile(userId, dto);
        return {
            userId: u.id,
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            defaultCurrency: u.defaultCurrency,
            showAmounts: u.showAmounts,
            createdAt: u.createdAt
        };
    }

    @UseGuards(JwtAuthGuard)
    @Put('password')
    @HttpCode(200)
    async changePassword(
        @Req() req: any,
        @Body() body: { currentPassword?: string; newPassword?: string; current?: string; next?: string }
    ) {
        const id = Number(req.user?.sub);
        const user = await this.users.findById(id);
        if (!user) throw new UnauthorizedException();
        const current = body.currentPassword ?? body.current;
        const next = body.newPassword ?? body.next;
        if (!current || !next) throw new BadRequestException('Manjka staro ali novo geslo');
        const ok = await bcrypt.compare(current, user.passwordHash);
        if (!ok) throw new UnauthorizedException('Napačno staro geslo');
        await this.users.updatePassword(id, next);
        return { ok: true };
    }
}
