import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUploadDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    source?: string;
}
