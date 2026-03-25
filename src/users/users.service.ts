import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(name: string, email: string, password: string, role: string) {
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await this.prisma.db.user.create({
      data: { name, email, password: hashedPassword, role }
    })

    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }
}