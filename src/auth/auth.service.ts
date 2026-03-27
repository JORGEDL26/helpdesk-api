import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.db.user.findUnique({
      where: { email }
    })

    if (!user) {
      throw new UnauthorizedException('Email ou senha inválidos')
    }

    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      throw new UnauthorizedException('Email ou senha inválidos')
    }

    const token = this.jwt.sign({ sub: user.id, role: user.role })

    return { token }
  }
}