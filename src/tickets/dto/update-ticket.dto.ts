import { ApiProperty } from '@nestjs/swagger';

export class UpdateTicketDto {
  @ApiProperty({ example: 'em_andamento', enum: ['aberto', 'em_andamento', 'fechado'] })
  status: string
}