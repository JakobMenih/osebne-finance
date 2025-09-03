import { BadRequestException, Body, Controller, Post, UnauthorizedException, UseGuards, Req, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './jwt-auth.guard';

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
        return { userId: req.user.sub, email: req.user.email };
    }
}
