import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { TransactionLinesModule } from './transaction-lines/transaction-lines.module';
import { BudgetsModule } from './budgets/budgets.module';
import { UploadsModule } from './uploads/uploads.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { UsersModule } from './users/users.module';
import {ConfigModule} from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AccountsModule,
    AuthModule,
    CategoriesModule,
    TransactionsModule,
    TransactionLinesModule,
    BudgetsModule,
    UploadsModule,
    AuditLogsModule,
    UsersModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
