import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class PrismaService implements OnModuleInit {
  private client: PrismaClient

  constructor() {
    const adapter = new PrismaPg({ 
      connectionString: process.env.DATABASE_URL 
    })
    this.client = new PrismaClient({ adapter })
  }

  async onModuleInit() {
    await this.client.$connect()
  }

  get db() {
    return this.client
  }
}