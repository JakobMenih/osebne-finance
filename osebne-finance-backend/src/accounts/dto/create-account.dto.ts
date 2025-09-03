import { IsIn, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateAccountDto {
    @IsString() @Length(1, 100) name!: string;
    @IsIn(['checking','savings','cash']) type!: 'checking'|'savings'|'cash';
    @IsString() @Length(3,3) currency!: string;
}
