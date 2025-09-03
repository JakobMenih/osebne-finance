import { Body, Controller, HttpCode, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import {LoginUserDto} from "../users/dto/login-user.dto";
import {JwtAuthGuard} from "./jwt-auth.guard";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService, private readonly usersService: UsersService) {}

    @Post('register')
    async register(@Body() dto: LoginUserDto) {
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.usersService.create({ email: dto.email, passwordHash });
        return { id: user.id, email: user.email };
    }

    @Post('login')
    async login(@Body() dto: LoginUserDto) {
        const user = await this.authService.validateUser(dto.email, dto.password);
        if (!user) {
            throw new UnauthorizedException();
        }
        return this.authService.login(user);
    }

    @UseGuards(JwtAuthGuard)
    @Post('profile')
    @HttpCode(200)
    profile(@Req() req: any) {
        return { userId: req.user.sub, email: req.user.email };
    }
}
