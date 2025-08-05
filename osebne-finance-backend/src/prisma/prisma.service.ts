import { Injectable, OnModuleInit, OnModuleDestroy, Scope, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';


@Injectable({ scope: Scope.REQUEST })
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor(@Inject(REQUEST) private readonly request: Request) {
        super();
    }

    async onModuleInit() {
        await this.$connect();

        this.$use(async (params, next) => {
            const result = await next(params);
            const userId = this.request?.user?.sub || null;

            if (['create', 'update', 'delete'].includes(params.action.toLowerCase()) && params.model) {
                try {
                    await this.auditLog.create({
                        data: {
                            tableName: params.model,
                            recordId: result?.id || params.args?.where?.id || null,
                            action: params.action[0].toUpperCase(),
                            oldData: params.action === 'update' ? params.args.data : null,
                            newData: result || null,
                            userId
                        }
                    });
                } catch (e) {
                    console.error('Audit log insert failed', e);
                }
            }
            return result;
        });
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
