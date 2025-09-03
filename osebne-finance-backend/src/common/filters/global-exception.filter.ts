import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    catch(err: any, host: ArgumentsHost) {
        const res = host.switchToHttp().getResponse();

        if (err instanceof HttpException) {
            const status = err.getStatus();
            return res.status(status).json(err.getResponse());
        }

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === 'P2002') return res.status(HttpStatus.CONFLICT).json({ message: 'Podatek že obstaja' });
            if (err.code === 'P2025') return res.status(HttpStatus.NOT_FOUND).json({ message: 'Ni najdeno' });
        }

        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Napaka strežnika' });
    }
}
