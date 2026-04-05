import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(title: string, description: string, userId: number) {
    const ticket= await this.prisma.db.ticket.create({
      data: { title, description, userId }
    })
    try {
    await fetch('https://webhook.site/b8358906-37cb-4d99-8abe-f4c50801e5c7', {
      method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket })
      })
    } catch (error) {
      console.error('Erro ao enviar webhook:', error)
    }
    return ticket
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
      where: { userId },
      include: {
        user: true,
      }
    })
  }

  async findAll(status: string, role: string) {
    if (role !== 'prestador') {
      throw new ForbiddenException('Acesso negado')
    }
    return this.prisma.db.ticket.findMany({
      where: status ? { status } : {}
    })
  }

  async deleteTicket(id: number, userId: number) {
    const ticket = await this.prisma.db.ticket.findUnique({
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
  async assignTicket(id: number, userId: number, role: string) {
    if (role !== 'prestador') {
      throw new ForbiddenException('Acesso negado')
    }
    const ticket = await this.prisma.db.ticket.findUnique({
      where: { id }
    })
    if (!ticket) {
      throw new NotFoundException('Ticket não encontrado')
    }
    return this.prisma.db.ticket.update({
      where: { id },
      data: { prestadorId: userId }
    })
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