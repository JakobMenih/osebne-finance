import { IsOptional, IsString, IsUUID, IsIn } from 'class-validator';

export class CreateCategoryDto {
    @IsString() name: string;
    @IsIn(['expense', 'income', 'transfer']) type: string;
    @IsOptional() @IsUUID() parentId?: string | null;
}