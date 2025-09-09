import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';

@Module({ imports: [PrismaModule], providers: [ExpensesService], controllers: [ExpensesController] })
export class ExpensesModule {}
