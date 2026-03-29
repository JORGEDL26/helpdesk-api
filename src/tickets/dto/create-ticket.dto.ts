import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({ example: 'Computador não liga' })
  title: string

  @ApiProperty({ example: 'O computador não liga desde ontem pela manhã' })
  description: string
}