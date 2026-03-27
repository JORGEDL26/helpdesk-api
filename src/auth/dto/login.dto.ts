import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'jorge@email.com' })
  email: string

  @ApiProperty({ example: '123456' })
  password: string
}