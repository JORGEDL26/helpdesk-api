import { ApiProperty } from '@nestjs/swagger';

export class CreateUserAdminDto {
  @ApiProperty({ example: 'Jorge' })
  name: string

  @ApiProperty({ example: 'jorge@email.com' })
  email: string

  @ApiProperty({ example: '123456' })
  password: string

  @ApiProperty({ example: 'prestador' })
  role: string
}