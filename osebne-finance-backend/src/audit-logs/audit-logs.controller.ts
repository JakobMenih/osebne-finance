import { Controller, Get, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditLogsService } from './audit-logs.service';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogsController {
    constructor(private readonly svc: AuditLogsService) {}

    @Get()
    getAll() {
        return this.svc.findAll();
    }

    @Get(':id')
    getOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.svc.findOne(id);
    }
}