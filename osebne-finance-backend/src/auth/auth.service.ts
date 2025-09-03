import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly users: UsersService,
        private readonly jwt: JwtService,
    ) {}

    async validateUser(email: string, plain: string) {
        const user = await this.users.findByEmail(email);
        if (!user) return null;
        const ok = await bcrypt.compare(plain, user.passwordHash);
        return ok ? user : null;
    }

    async login(user: { id: string; email: string }) {
        const payload = { sub: user.id, email: user.email };
        return { access_token: await this.jwt.signAsync(payload) };
    }
}