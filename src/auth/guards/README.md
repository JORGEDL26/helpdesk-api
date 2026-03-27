# Guard de Autenticação

O Guard é o **porteiro** da aplicação. Antes de qualquer requisição chegar no controller de uma rota protegida, o Guard intercepta e pergunta: *"você tem um token válido?"*. Se sim, deixa passar. Se não, barra com `401`.

```
Requisição chega
      ↓
Guard verifica o token
      ↓
Token válido?    →  deixa passar pro controller
Token inválido?  →  barra com 401, controller nem vê a requisição
```

---

## Os arquivos

```
src/auth/guards/
└── jwt.guard.ts    # o porteiro — verifica o token em toda rota protegida
```

---

## jwt.guard.ts — na linguagem humana

```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não encontrado')
    }

    const token = authHeader.split(' ')[1]

    try {
      const payload = this.jwt.verify(token)
      request['user'] = payload
      return true
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado')
    }
  }
}
```

**Linha por linha:**

`implements CanActivate` → contrato do NestJS que diz: *"essa classe é um Guard"*. Todo Guard precisa ter um método `canActivate` que retorna `true` ou `false`. Verdadeiro deixa passar, falso barra.

`canActivate(context: ExecutionContext)` → esse método roda automaticamente antes de qualquer rota que tiver o Guard aplicado. O `context` é de onde a gente tira as informações da requisição.

`context.switchToHttp().getRequest()` → pega o objeto da requisição HTTP — onde estão os headers, o body, a URL. É mecânica do NestJS — você copia isso de projeto em projeto sem pensar muito.

`request.headers.authorization` → pega o header `Authorization` da requisição. É aqui que o cliente manda o token. O formato padrão é:
```
Authorization: Bearer eyJhbGci...
```

`if (!authHeader || !authHeader.startsWith('Bearer '))` → se não veio o header, ou se não começa com `Bearer`, barra com 401. O `Bearer` é o tipo do token — padrão do mercado pra JWT.

`authHeader.split(' ')[1]` → separa a string pelo espaço e pega o segundo pedaço — só o token, sem o `Bearer`:
```
"Bearer eyJhbGci..."
  split(' ')  →  ["Bearer", "eyJhbGci..."]
  [1]         →  "eyJhbGci..."
```

`this.jwt.verify(token)` → verifica se o token é válido e retorna o payload — o `sub`, `role`, `iat`, `exp`. Se o token for inválido ou expirado, lança uma exceção que o `catch` captura.

`request['user'] = payload` → guarda o payload dentro da requisição. Assim, nos controllers protegidos, você consegue saber quem está fazendo a chamada — o `id` e o `role` ficam disponíveis em `req.user`.

`return true` → deixa a requisição passar pro controller.

`catch { throw new UnauthorizedException(...) }` → se o `verify` falhar por qualquer motivo, retorna 401.

---

## Esse arquivo é um padrão

Você cria uma vez e nunca mais mexe. Em todo projeto que você entrar vai ter um Guard praticamente igual a esse. O que importa entender é o conceito:

```
Guard        =  porteiro que roda antes do controller
canActivate  =  a pergunta "pode passar?"
true         =  deixa passar
throw        =  barra com 401
```

---

## Como usar o Guard numa rota

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtGuard)   →  coloca o porteiro na frente dessa rota
@Get('me')
me(@Request() req: any) {
  return this.usersService.findMe(req.user.sub)
  //                               ↑
  //                        id do usuário logado
  //                        vem do payload do token
  //                        que o Guard guardou em req.user
}
```

`@UseGuards(JwtGuard)` → decorator que aplica o Guard na rota logo abaixo. Sem token válido, o método nem é executado.

`@Request() req` → pega o objeto da requisição inteira. O Guard já colocou o payload do token em `req.user`, então você acessa o id com `req.user.sub` e o papel com `req.user.role`.

---

## Fluxo completo de uma rota protegida

```
GET /users/me
Authorization: Bearer eyJhbGci...
      ↓
JwtGuard.canActivate()
  pega o header Authorization
  separa o token do Bearer
  verifica o token com jwt.verify()
  guarda o payload em req.user
  return true
      ↓
UsersController.me()
  pega o id de req.user.sub
  chama usersService.findMe(id)
      ↓
UsersService.findMe()
  busca o usuário no banco pelo id
  remove a senha do retorno
      ↓
{ "id": 2, "name": "Jorge", "email": "jorge@email.com", "role": "user" }
```

Sem token:
```
GET /users/me  (sem header Authorization)
      ↓
JwtGuard.canActivate()
  header não encontrado
  throw new UnauthorizedException()
      ↓
{ "statusCode": 401, "message": "Token não encontrado" }
```

---

## O que precisou ser atualizado nos módulos

**`auth.module.ts`** → registrou e exportou o Guard:
```typescript
providers: [AuthService, JwtGuard],  // registra
exports: [JwtGuard, JwtModule],      // exporta pra outros módulos usarem
```

**`users.module.ts`** → importou o AuthModule pra poder usar o Guard:
```typescript
imports: [PrismaModule, AuthModule],
// AuthModule exporta JwtGuard → UsersController consegue usar @UseGuards(JwtGuard)
```

---

## Regra de ouro — imports vs providers

```
O arquivo está na minha pasta?    →  providers
O arquivo está na pasta de outro?  →  imports
```

Você nunca coloca em `providers` algo que veio de outro módulo. Só coloca o que pertence ao próprio módulo.