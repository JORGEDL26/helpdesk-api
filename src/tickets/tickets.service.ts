import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(title: string, description: string, userId: number) {
    return this.prisma.db.ticket.create({
      data: { title, description, userId }
    })
  }

  async remove(id:number, userId: number) {
    const ticket= await this.prisma.db.ticket.findUnique({
      where: { id }
    })
    if (!ticket) {
      throw new NotFoundException('Ticket não encontrado')
    }
    if (ticket.userId !== userId) {
      throw new ForbiddenException('Acesso negado')
    }
    return this.prisma.db.ticket.delete({
      where: { id }
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