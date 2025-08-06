import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
    IsUUID,
    IsDateString,
    IsNumber, IsOptional
} from 'class-validator';

export function IsAfter(property: string, validationOptions?: ValidationOptions) {
    return (object: any, propertyName: string) => {
        registerDecorator({
            name: 'isAfter',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [property],
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[relatedPropertyName];
                    return new Date(value) > new Date(relatedValue);
                },
                defaultMessage(args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    return `${args.property} must be after ${relatedPropertyName}`;
                },
            },
        });
    };
}

export class CreateBudgetDto {
    @IsUUID()
    categoryId: string;

    @IsDateString()
    periodStart: string;

    @IsDateString()
    @IsAfter('periodStart', { message: 'periodEnd must be after periodStart' })
    periodEnd: string;

    @IsNumber()
    amount: number;

    @IsOptional()
    metadata?: Record<string, any>;
}