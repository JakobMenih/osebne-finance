import { Module } from '@nestjs/common';
import { AllocationsService } from './allocations.service';
import { AllocationsController } from './allocations.controller';

@Module({ providers: [AllocationsService], controllers: [AllocationsController] })
export class AllocationsModule {}
