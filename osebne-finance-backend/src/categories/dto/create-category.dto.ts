import { IsString, IsNotEmpty, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { CategoryType } from '@prisma/client';

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(CategoryType)
    type: CategoryType;

    @IsUUID()
    @IsOptional()
    parentId?: string;
}
