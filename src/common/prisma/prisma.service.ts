import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(`${PrismaService.name}::ORDERS-MS`);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('🚀 Prisma Client connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
