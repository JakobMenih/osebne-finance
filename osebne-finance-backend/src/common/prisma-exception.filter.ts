import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        const req = ctx.getRequest();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: any = 'Internal Server Error';

        if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            switch (exception.code) {
                case 'P2002': status = 409; message = { code: exception.code, target: exception.meta?.target }; break;
                case 'P2003': status = 400; message = { code: exception.code, field: exception.meta?.field_name }; break;
                case 'P2025': status = 404; message = { code: exception.code }; break;
                default:      status = 400; message = { code: exception.code, meta: exception.meta };
            }
        } else if (exception instanceof Prisma.PrismaClientValidationError) {
            status = 400; message = exception.message;
        }

        // eslint-disable-next-line no-console
        console.error('[ERROR]', req.method, req.url, message);
        res.status(status).json({ statusCode: status, message });
    }
}
