import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()

export async function seed() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
  })

  const prisma = new PrismaClient({ adapter })

  await prisma.user.upsert({
    where: { email: 'admin' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin'
    }
  })

  await prisma.$disconnect()
  console.log('✅ Admin criado')
}