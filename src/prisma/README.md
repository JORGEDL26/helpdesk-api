# Módulo Prisma

Esse módulo é responsável por **conectar a aplicação com o banco de dados**. Ele não tem rotas, não recebe requisição nenhuma — ele existe pra ser usado pelos outros módulos que precisam falar com o banco.

---

## Os arquivos

```
src/prisma/
├── prisma.module.ts    # registra e exporta o PrismaService
└── prisma.service.ts   # cria a conexão com o banco
```

---

## prisma.service.ts — na linguagem humana

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class PrismaService implements OnModuleInit {
  private client: PrismaClient

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL
    })
    this.client = new PrismaClient({ adapter })
  }

  async onModuleInit() {
    await this.client.$connect()
  }

  get db() {
    return this.client
  }
}
```

**Linha por linha:**

`dotenv.config()` → carrega o arquivo `.env` nas variáveis de ambiente. Sem isso, o `process.env.DATABASE_URL` estaria vazio.

`@Injectable()` → avisa o NestJS que essa classe pode ser injetada no constructor de outras classes. Sem esse decorator, o NestJS ignora a classe na hora de resolver dependências.

`export class PrismaService implements OnModuleInit` → cria a classe. O `implements OnModuleInit` é um contrato que diz: *"essa classe vai ter um método `onModuleInit` que o NestJS deve chamar quando o módulo inicializar"*.

`private client: PrismaClient` → declara que essa classe vai ter uma propriedade chamada `client`. O `private` significa que só o código dentro dessa classe pode acessá-la — nenhum outro arquivo acessa o `client` diretamente.

`constructor()` → roda quando o NestJS cria o `PrismaService`. Aqui a gente cria o adapter com a URL do banco e passa pro `PrismaClient`. O Prisma 7 exige um adapter explícito — ele não lê a URL automaticamente da aplicação, só da CLI.

`async onModuleInit()` → o NestJS chama esse método automaticamente depois de criar o módulo. É onde a conexão com o banco é estabelecida de verdade. O `await this.client.$connect()` abre a conexão.

`get db()` → é um getter — uma forma de expor o `client` de forma controlada. Outros services usam `this.prisma.db.user.create(...)` em vez de acessar o `client` diretamente. Isso mantém a abstração.

---

## prisma.module.ts — na linguagem humana

```typescript
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**`providers: [PrismaService]`** → registra o `PrismaService` dentro desse módulo. Isso diz pro NestJS: *"esse serviço existe e pode ser criado"*.

**`exports: [PrismaService]`** → torna o `PrismaService` disponível pra outros módulos. No NestJS, mesmo que um módulo tenha um service em `providers`, outros módulos **não conseguem usá-lo** a menos que ele esteja em `exports`. É uma forma de controlar o que é público e o que é privado.

Em português: *"esse módulo tem o PrismaService e qualquer outro módulo que me importar pode usar"*.

---

## Como outros módulos usam esse módulo

O `UsersModule` importa o `PrismaModule`:

```typescript
@Module({
  imports: [PrismaModule],   // "quero usar o que o PrismaModule exporta"
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

Isso autoriza o `UsersService` a receber o `PrismaService` no constructor:

```typescript
constructor(private readonly prisma: PrismaService) {}
// o NestJS entrega o PrismaService porque:
// 1. UsersModule importou PrismaModule
// 2. PrismaModule exporta PrismaService
// 3. NestJS resolve a dependência automaticamente
```

---

## O schema do banco

Definido em `prisma/schema.prisma`. Cada `model` vira uma tabela no banco.

```prisma
model User {
  id       Int      @id @default(autoincrement())  // chave primária, auto incremento
  name     String
  email    String   @unique                         // não pode repetir
  password String
  role     String   @default("user")                // valor padrão
  tickets  Ticket[]                                 // relação com tickets
}

model Ticket {
  id          Int      @id @default(autoincrement())
  title       String
  description String
  status      String   @default("aberto")
  createdAt   DateTime @default(now())              // data/hora automática
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
  // userId é a chave estrangeira que aponta pro id do User
}
```

---

## Migrations — o que são e por que existem

Migration é um arquivo que registra uma mudança no banco. Em vez de você ir lá e alterar a tabela na mão, o Prisma gera um arquivo SQL com o que mudou e executa.

Isso resolve um problema real: quando o sistema está em produção com dados, você não pode recriar a tabela do zero. Você precisa registrar o que mudou.

```bash
# cria uma nova migration com o nome "init"
npx prisma migrate dev --name init

# gera os arquivos em:
prisma/migrations/
  └─ 20260325_init/
      └─ migration.sql   ← o SQL que foi executado
```

Cada migration roda uma vez e nunca mais. O Prisma controla isso na tabela `_prisma_migrations` do banco.