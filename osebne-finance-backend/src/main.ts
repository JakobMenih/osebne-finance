import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.use(helmet());
    const origins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
    app.enableCors({ origin: origins.length ? origins : true, credentials: true });

    app.use('/auth', rateLimit({ windowMs: 60_000, max: 100 }));

    if (process.env.NODE_ENV !== 'production') {
        const config = new DocumentBuilder().setTitle('Finančnik API').setVersion('1.0').addBearerAuth().build();
        const doc = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('docs', app, doc);
    }

    await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}
bootstrap();
