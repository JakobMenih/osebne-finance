import { IsUUID, IsDateString, IsNumber, IsOptional } from 'class-validator';

export class CreateBudgetDto {
    @IsUUID()
    categoryId: string;

    @IsDateString()
    periodStart: string;

    @IsDateString()
    periodEnd: string;

    @IsNumber()
    amount: number;

    @IsOptional()
    metadata?: Record<string, any>;
}