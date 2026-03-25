# Módulo Users

Esse módulo é responsável por tudo relacionado a usuários — cadastro, e futuramente login, listagem e atualização. Cada funcionalidade nova de usuário entra aqui.

---

## Os arquivos

```
src/users/
├── users.module.ts       # registra e conecta controller + service
├── users.controller.ts   # recebe as requisições HTTP
└── users.service.ts      # contém a lógica de verdade
```

---

## users.module.ts — na linguagem humana

```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

**Linha por linha:**

`imports: [PrismaModule]` → esse módulo está dizendo: *"quero usar o que o PrismaModule oferece"*. Sem isso, o `UsersService` não conseguiria receber o `PrismaService` no constructor — o NestJS não saberia de onde vir.

`controllers: [UsersController]` → registra o controller. O NestJS vai criar o `UsersController` e mapear as rotas dele automaticamente.

`providers: [UsersService]` → registra o service. O NestJS vai criar o `UsersService` e disponibilizá-lo pra ser injetado no controller.

**O módulo é configuração, não execução.** Ele roda na inicialização e monta o quebra-cabeça. Depois disso, quem trabalha de verdade é o controller e o service.

---

## users.controller.ts — na linguagem humana

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() body: { name: string; email: string; password: string; role: string }) {
    return this.usersService.create(body.name, body.email, body.password, body.role)
  }
}
```

**Linha por linha:**

`import { Controller, Post, Body }` → importa os decorators necessários. Cada um tem uma função específica descrita abaixo.

`@Controller('users')` → marca essa classe como controller e define o prefixo das rotas. Tudo aqui responde em `/users`.

`constructor(private readonly usersService: UsersService)` → quando o NestJS criar esse controller, ele entrega um `UsersService` pronto. O `private readonly` guarda ele como propriedade da classe automaticamente — sem isso você teria que fazer na mão: `this.usersService = usersService`.

`@Post()` → esse método responde a requisições `POST`. Como o controller já está em `/users`, a rota completa é `POST /users`.

`@Body()` → pega o JSON que veio no corpo da requisição e coloca na variável `body`. O NestJS faz isso automaticamente quando vê esse decorator.

`{ name: string; email: string; password: string; role: string }` → é o TypeScript dizendo o formato esperado do body. Se vier um campo errado ou faltando, o TypeScript avisa antes de rodar.

`return this.usersService.create(...)` → o controller não faz lógica. Ele só recebe os dados e passa pro service. O que o service retornar, o controller devolve como resposta HTTP.

---

## users.service.ts — na linguagem humana

```typescript
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
```

**Linha por linha:**

`import * as bcrypt from 'bcryptjs'` → importa tudo da biblioteca bcrypt com o apelido `bcrypt`. O bcrypt é usado pra transformar a senha em um hash — nunca salvamos senha em texto puro no banco.

`@Injectable()` → avisa o NestJS que essa classe pode ser injetada em outras. Sem isso o NestJS não consegue entregar ela pro controller.

`constructor(private readonly prisma: PrismaService)` → recebe o `PrismaService` que o NestJS injeta. A partir daqui, `this.prisma` está disponível em todos os métodos da classe.

`async create(...)` → função assíncrona. O `async` existe porque dentro dela tem operações que levam tempo (hash de senha e escrita no banco). Sem `async`, não poderia usar `await`.

`const hashedPassword = await bcrypt.hash(password, 10)` → transforma a senha em hash. O `10` é o número de rounds — quantas vezes o algoritmo embaralha a senha. 10 é o padrão do mercado. O `await` espera o hash ser gerado antes de continuar.

`const user = await this.prisma.db.user.create({ data: {...} })` → salva o usuário no banco. O `await` espera o banco confirmar antes de continuar. O `.db` acessa o getter do `PrismaService`, e `.user.create` é o método do Prisma pra inserir um registro na tabela `User`.

`const { password: _, ...userWithoutPassword } = user` → remove a senha do objeto antes de retornar. Nunca se devolve senha numa resposta de API. Funciona assim:
- `password: _` → pega o campo `password` mas salva com o nome `_` (convenção pra "vou ignorar isso")
- `...userWithoutPassword` → o `...` captura tudo que sobrou — o objeto sem o `password`

`return userWithoutPassword` → devolve o usuário sem a senha pro controller, que repassa como resposta HTTP.

---

## Fluxo completo de um cadastro

```
POST /users
{ "name": "Jorge", "email": "jorge@email.com", "password": "123456", "role": "user" }
      ↓
UsersController.create()
  recebe o body
      ↓
UsersService.create()
  bcrypt.hash("123456", 10) → "$2b$10$..."
  prisma.db.user.create({ data: { name, email, password: hash, role } })
      ↓
Banco salva o registro
      ↓
Service remove o password do retorno
      ↓
Controller devolve a resposta

{ "id": 1, "name": "Jorge", "email": "jorge@email.com", "role": "user" }
```

---

## Rotas desse módulo

| Método | Rota | Descrição | Body |
|--------|------|-----------|------|
| POST | /users | Cadastra um novo usuário | `{ name, email, password, role }` |