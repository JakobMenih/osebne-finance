declare namespace Express {
    export interface UserPayload {
        sub: string;
        email: string;
    }

    export interface Request {
        user?: UserPayload;
    }
}
