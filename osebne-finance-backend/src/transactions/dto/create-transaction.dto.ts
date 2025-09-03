import { IsISO8601, IsIn, IsNumber, IsOptional, IsString, Length, ValidateNested, IsArray, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class TransactionLineDto {
    @IsString() accountId!: string;
    @IsIn(['in','out','transfer']) kind!: 'in'|'out'|'transfer';
    @IsNumber() amount!: number;
    @IsString() @Length(3,3) currency!: string;

    @IsOptional() @IsString() categoryId?: string;
    @IsOptional() @IsString() description?: string;

    @IsOptional() @IsString() @Length(3,3) baseCurrency?: string;
    @IsOptional() @IsNumber() exchangeRate?: number;
}

export class CreateTransactionDto {
    @IsISO8601() date!: string;

    @IsOptional() @IsString() note?: string;

    @IsOptional() @IsString() description?: string;
    @IsOptional() @IsObject() metadata?: Record<string, any>;

    @IsArray() @ValidateNested({ each: true }) @Type(() => TransactionLineDto)
    lines!: TransactionLineDto[];
}
