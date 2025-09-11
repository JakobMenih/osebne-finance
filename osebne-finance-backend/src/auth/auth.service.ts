import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(private readonly users: UsersService, private readonly jwt: JwtService) {}

    async validateUser(email?: string, password?: string) {
        if (!email || !password) return null;
        const user: any = await this.users.findByEmail(email);
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        return ok ? user : null;
    }

    async login(user: any) {
        const payload = { sub: user.id, email: user.email };
        return { access_token: await this.jwt.signAsync(payload) };
    }
}