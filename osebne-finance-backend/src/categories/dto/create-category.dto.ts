import { IsIn, IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';

export class CreateCategoryDto {
    @IsString() @Length(1, 100) name!: string;
    @IsIn(['income','expense']) type!: 'income'|'expense';
    @IsOptional() parentId?: string;
}
