import { Module } from '@nestjs/common';
import { TransactionLinesService } from './transaction-lines.service';
import { TransactionLinesController } from './transaction-lines.controller';

@Module({
  providers: [TransactionLinesService],
  controllers: [TransactionLinesController]
})
export class TransactionLinesModule {}
