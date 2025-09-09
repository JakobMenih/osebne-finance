import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';

@Module({ imports: [PrismaModule], providers: [TransfersService], controllers: [TransfersController] })
export class TransfersModule {}
