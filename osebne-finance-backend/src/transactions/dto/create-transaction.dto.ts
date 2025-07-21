import { IsDateString, IsOptional, IsString, IsISO8601, IsNotEmpty } from 'class-validator';

export class CreateTransactionDto {
    @IsISO8601()
    date: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    metadata?: Record<string, any>;
}