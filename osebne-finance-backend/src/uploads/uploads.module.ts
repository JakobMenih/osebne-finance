import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [
        PrismaModule,
        ConfigModule,
        MulterModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (cfg: ConfigService) => ({
                dest: cfg.get<string>('UPLOAD_DIR') ?? './var/uploads',
                limits: { fileSize: 5 * 1024 * 1024 }
            })
        })
    ],
    controllers: [UploadsController],
    providers: [UploadsService],
    exports: [UploadsService]
})
export class UploadsModule {}
