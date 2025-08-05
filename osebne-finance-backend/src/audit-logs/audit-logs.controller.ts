import { Controller, Get, Param, UseGuards, ParseUUIDPipe, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditLogsService } from './audit-logs.service';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogsController {
    constructor(private readonly svc: AuditLogsService) {}

    @Get()
    getAll(@Req() req) {
        return this.svc.findAll(req.user.sub);
    }

    @Get(':id')
    getOne(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
        return this.svc.findOne(id, req.user.sub);
    }
}
