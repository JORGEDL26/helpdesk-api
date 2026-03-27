import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Jorge' })
  name: string

  @ApiProperty({ example: 'jorge@email.com' })
  email: string

  @ApiProperty({ example: '123456' })
  password: string

  @ApiProperty({ example: 'user', enum: ['user', 'prestador'] })
  role: string
}