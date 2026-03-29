import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(title: string, description: string, userId: number) {
    return this.prisma.db.ticket.create({
      data: { title, description, userId }
    })
  }

  async findMine(userId: number) {
    return this.prisma.db.ticket.findMany({
      where: { userId }
    })
  }

  async findAll(role: string) {
    if (role !== 'prestador') {
      throw new ForbiddenException('Acesso negado')
    }
    return this.prisma.db.ticket.findMany()
  }

  async updateStatus(id: number, status: string, role: string) {
    if (role !== 'prestador') {
      throw new ForbiddenException('Acesso negado')
    }
    return this.prisma.db.ticket.update({
      where: { id },
      data: { status }
    })
  }
}