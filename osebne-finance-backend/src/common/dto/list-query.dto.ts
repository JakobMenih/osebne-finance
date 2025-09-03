import { IsInt, IsOptional, IsIn, IsISO8601, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListQueryDto {
    @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
    @IsOptional() @Type(() => Number) @IsInt() @Min(1) pageSize?: number = 20;
    @IsOptional() @IsString() sort?: string;
    @IsOptional() @IsIn(['asc', 'desc']) order?: 'asc' | 'desc' = 'asc';
    @IsOptional() @IsISO8601() from?: string;
    @IsOptional() @IsISO8601() to?: string;
}
