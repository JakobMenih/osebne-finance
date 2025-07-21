import { PartialType } from '@nestjs/mapped-types';
import { CreateTransactionLineDto } from './create-transaction-line.dto';

export class UpdateTransactionLineDto extends PartialType(CreateTransactionLineDto) {}
