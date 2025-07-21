import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {}

    private async validateUser(email: string, pass: string) {
        const user = await this.usersService.findByEmail(email);
        if (user && (await bcrypt.compare(pass, user.passwordHash))) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async login(dto: LoginUserDto) {
        const user = await this.validateUser(dto.email, dto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload = { sub: user.id, email: user.email };
        return { access_token: this.jwtService.sign(payload) };
    }
}
