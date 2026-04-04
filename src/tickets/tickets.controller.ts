import { Controller, Post, Get, Patch, Body, Param, Request, UseGuards, Delete } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@Body() body: CreateTicketDto, @Request() req: any) {
    return this.ticketsService.create(body.title, body.description, req.user.sub)
  }

  @Get('mine')
  findMine(@Request() req: any) {
    return this.ticketsService.findMine(req.user.sub)
  }

  @Get()
  findAll(@Request() req: any) {
    return this.ticketsService.findAll(req.user.role)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.ticketsService.remove(Number(id), req.user.sub)
  }

  @Patch(':id')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateTicketDto,
    @Request() req: any
  ) {
    return this.ticketsService.updateStatus(Number(id), body.status, req.user.role)
  }
}