# Módulo Auth

Esse módulo é responsável por tudo relacionado a autenticação — login e geração do JWT. Futuramente pode incluir refresh token, logout, e recuperação de senha.

---

## Os arquivos

```
src/auth/
├── auth.module.ts       # registra controller + service, configura o JWT
├── auth.controller.ts   # recebe as requisições HTTP
└── auth.service.ts      # contém a lógica de verdade
```

---

## O que é JWT — na linguagem humana

JWT não tem nada a ver com senha. São duas coisas separadas:

**bcrypt** → cuida da senha. Transforma a senha em hash na hora de salvar, e verifica se a senha bate na hora do login.

**JWT** → cuida da autenticação depois do login. Depois que o usuário logou e a senha foi verificada, o servidor gera um JWT e entrega pro cliente. Nas próximas requisições o cliente manda esse JWT, e o servidor sabe quem é sem precisar pedir email e senha de novo.

Pensa assim:

```
Login              →  você mostra seu RG na portaria
JWT                →  a portaria te dá um crachá
Próximas requests  →  você mostra o crachá, não precisa mostrar o RG de novo
```

O JWT é o crachá. Ele contém informações como o `id` e o `role` do usuário, e é assinado pelo servidor com um segredo (`JWT_SECRET`). Se alguém tentar falsificar o crachá, a assinatura não bate e o servidor rejeita.

---

## Estrutura do JWT

Um JWT tem três partes separadas por ponto:

```
eyJhbGci....  →  Header   (algoritmo usado)
eyJzdWIi....  →  Payload  (os dados)
KKv7b5a3....  →  Signature (assinatura do servidor)
```

O Payload é o que importa — é o que o servidor coloca dentro do token:

```json
{
  "sub": 2,           // id do usuário no banco
  "role": "user",     // papel do usuário
  "iat": 1774486530,  // issued at — quando foi gerado (timestamp)
  "exp": 1775091330   // expires at — quando expira (7 dias depois)
}
```

O JWT é **público** — qualquer um pode decodificar e ver o conteúdo em jwt.io. O que garante a segurança é a **assinatura** — só o servidor que tem o `JWT_SECRET` consegue gerar um token válido. Se alguém tentar falsificar, a assinatura não bate.

**Por isso nunca coloque senha ou dados sensíveis dentro do JWT.**

---

## auth.module.ts — na linguagem humana

```typescript
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
```

**Linha por linha:**

`imports: [PrismaModule]` → importa o Prisma pra que o `AuthService` possa buscar o usuário no banco.

`JwtModule.register({...})` → o `.register()` é o jeito de passar configurações pro módulo na hora de importar. Em vez de só `imports: [JwtModule]`, você passa as opções:
- `secret` → o segredo usado pra assinar e verificar o token. Vem do `.env`
- `expiresIn: '7d'` → o token expira em 7 dias. Depois disso o usuário precisa logar de novo

---

## auth.service.ts — na linguagem humana

```typescript
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
```

**Linha por linha:**

`constructor(private readonly prisma, private readonly jwt)` → esse service precisa de dois: o `PrismaService` pra buscar o usuário no banco, e o `JwtService` pra gerar o token. O NestJS entrega os dois automaticamente.

`prisma.db.user.findUnique({ where: { email } })` → busca um único usuário pelo email. O `findUnique` é o método do Prisma pra buscar por campo único — funciona porque o email tem `@unique` no schema.

`if (!user) throw new UnauthorizedException(...)` → se não encontrou o usuário, interrompe tudo e retorna um erro `401 Unauthorized`. O `throw` para a execução da função na hora.

Por que a mesma mensagem nos dois erros? — se você dissesse *"usuário não encontrado"* alguém poderia usar isso pra descobrir quais emails estão cadastrados. A mensagem genérica protege essa informação.

`bcrypt.compare(password, user.password)` → compara a senha digitada com o hash salvo no banco. O bcrypt consegue fazer isso sem precisar descriptografar — ele aplica o mesmo algoritmo na senha digitada e compara os resultados.

`this.jwt.sign({ sub: user.id, role: user.role })` → gera o token JWT com duas informações:
- `sub` → id do usuário. `sub` é o nome padrão no JWT, vem de "subject"
- `role` → o papel do usuário, pra saber o que ele pode fazer nas próximas requisições

`return { token }` → devolve o token pro controller, que repassa como resposta HTTP.

---

## auth.controller.ts — na linguagem humana

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password)
  }
}
```

**Linha por linha:**

`@Controller('auth')` → todas as rotas desse controller respondem em `/auth`.

`@Post('login')` → o sufixo `login` combina com o prefixo `auth` pra formar a rota completa `POST /auth/login`.

`@Body()` → pega o JSON que veio no corpo da requisição e coloca na variável `body`.

O controller não faz lógica nenhuma — só recebe os dados e passa pro service.

---

## Fluxo completo de um login

```
POST /auth/login
{ "email": "jorge@email.com", "password": "123456" }
      ↓
AuthController.login()
  recebe o body
      ↓
AuthService.login()
  busca o usuário pelo email no banco
  se não encontrar → 401 Unauthorized
  compara a senha com o hash do banco
  se não bater     → 401 Unauthorized
  gera o JWT com { sub: id, role }
      ↓
Retorna o token

{ "token": "eyJhbGci..." }
```

---

## Rotas desse módulo

| Método | Rota | Descrição | Body |
|--------|------|-----------|------|
| POST | /auth/login | Loga e retorna o JWT | `{ email, password }` |