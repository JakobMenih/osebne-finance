import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import {UploadsModule} from "./uploads/uploads.module";
import {IncomesModule} from "./incomes/incomes.module";
import {ExpensesModule} from "./expenses/expenses.module";
import {TransfersModule} from "./transfers/transfers.module";
import {HealthController} from "./health.controller";

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        UsersModule,
        CategoriesModule,
        UploadsModule,
        IncomesModule,
        ExpensesModule,
        TransfersModule,
        HealthController
    ],
})
export class AppModule {}
