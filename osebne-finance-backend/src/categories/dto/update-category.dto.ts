import { IsOptional, IsString, IsUUID, IsIn } from 'class-validator';

export class UpdateCategoryDto {
    @IsOptional() @IsString() name?: string;
    @IsOptional() @IsIn(['expense', 'income', 'transfer']) type?: string;
    @IsOptional() @IsUUID() parentId?: string | null;
}
