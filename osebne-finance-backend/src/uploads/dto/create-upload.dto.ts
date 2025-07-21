import { IsOptional, IsString } from 'class-validator';

export class CreateUploadDto {
    @IsOptional()
    @IsString()
    source?: string;

    @IsOptional()
    fileMetadata?: Record<string, any>;
}