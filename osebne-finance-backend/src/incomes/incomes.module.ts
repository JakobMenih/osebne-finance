import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IncomesService } from './incomes.service';
import { IncomesController } from './incomes.controller';

@Module({ imports: [PrismaModule], providers: [IncomesService], controllers: [IncomesController] })
export class IncomesModule {}
