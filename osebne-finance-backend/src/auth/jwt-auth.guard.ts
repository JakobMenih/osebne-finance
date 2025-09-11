import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    getRequest(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest();
        const tokenFromQuery = req?.query?.token ? `Bearer ${req.query.token}` : null;
        if (!req.headers['authorization'] && tokenFromQuery) {
            req.headers['authorization'] = tokenFromQuery;
        }
        return req;
    }

    handleRequest(err: any, user: any) {
        if (err || !user) {
            throw err || new UnauthorizedException();
        }
        return user;
    }
}
