import { IsUUID, IsNumber, IsPositive, IsOptional, IsString, Length } from 'class-validator';

export class CreateTransactionLineDto {
    @IsUUID()
    transactionId: string;

    @IsUUID()
    accountId: string;

    @IsUUID()
    @IsOptional()
    categoryId?: string;

    @IsNumber()
    amount: number;

    @IsString()
    @Length(3, 3)
    currency: string;

    @IsOptional()
    @IsString()
    description?: string;
}
