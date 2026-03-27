# HelpDesk API

Sistema de chamados com autenticação JWT, dois perfis de usuário (`user` e `prestador`), criação e acompanhamento de tickets.

**Stack:** NestJS · TypeScript · Prisma · PostgreSQL · Docker

---

## O que é cada ferramenta e por que usamos

**NestJS** é um framework que organiza sua API em pedaços bem definidos. Ele já vem com uma estrutura de pastas, e cada arquivo tem uma responsabilidade clara. É o mais usado no mercado hoje pra APIs em TypeScript.

**Prisma** é a ferramenta que faz sua aplicação falar com o banco. Você descreve seus dados num arquivo simples (`schema.prisma`), e ele gera as tabelas, controla as mudanças ao longo do tempo e te dá tipagem automática — você nunca escreve SQL na mão.

**PostgreSQL no Docker** — banco relacional rodando em container com volume persistente. Você já conhece isso do lado de Ops.

---

## TypeScript — o que é e por que existe

TypeScript não é uma linguagem separada. Ele é uma camada que fica **em cima do JavaScript**. O Node nunca aprendeu a ler TypeScript — ele só entende JavaScript. Então o TypeScript precisa ser "traduzido" antes de rodar.

```
Você escreve  →  TypeScript (.ts)
Compilador    →  tsc transforma em JavaScript (.js)
Node roda     →  JavaScript puro
```

O benefício é que o TypeScript te avisa de erros **antes de rodar** o código. Se você tentar usar um campo que não existe, ele já reclama no editor.

### Por que temos `dev` e `start`?

```
npm run dev    →  ts-node src/main.ts
                  compila na memória, sem gerar arquivo
                  use enquanto está desenvolvendo

npm run build  →  tsc
                  gera os arquivos .js em dist/

npm start      →  node dist/main.js
                  roda o JavaScript compilado
                  use em produção / container
```

---

## Como o NestJS organiza o código

```
Módulo      →  agrupa e registra controller + service
Controller  →  recebe a requisição HTTP e chama o service
Service     →  contém a lógica de verdade (regras, banco, etc)
```

## Receita — ordem de criação de qualquer módulo

Sempre nessa ordem:

```
1. Service     → escreve a lógica (regras, banco, etc)
2. Controller  → escreve as rotas que chamam o service
3. Module      → registra os dois e importa o que precisar
```

Perguntas pra guiar:

```
"O que essa funcionalidade precisa fazer?"  →  escreve no service
"Qual rota vai chamar isso?"                →  escreve no controller
"Esse módulo precisa de outro módulo?"      →  importa no module
```

**Módulo é configuração, não execução.** Ele não processa requisição nenhuma — ele roda na inicialização e diz pro NestJS o que existe e quem depende de quem.


Fluxo de uma requisição:

```
POST /users { name, email, password, role }
      ↓
Controller   →  recebe o body e chama o service
      ↓
Service      →  faz o hash da senha e salva no banco
      ↓
Prisma       →  executa o INSERT no Postgres
      ↓
Controller   →  devolve o usuário criado como resposta HTTP
```

---

## Classes e Constructor — na linguagem humana

Uma classe é um **molde**. Ela descreve como algo vai ser e o que esse algo sabe fazer.

```typescript
class Carro {
  cor: string
  marca: string

  constructor(corEscolhida: string, marcaEscolhida: string) {
    this.cor = corEscolhida
    this.marca = marcaEscolhida
  }

  buzinar() {
    console.log("FOOOOM")
  }
}

const meuCarro = new Carro("vermelho", "Honda")
// meuCarro.cor   → "vermelho"
// meuCarro.marca → "Honda"
```

O **constructor** roda no momento em que o objeto é criado com `new`. É onde você configura as coisas iniciais.

No NestJS você nunca escreve `new UsersService()` — o NestJS faz isso por você. O constructor é onde a classe fala: *"quando me criarem, me entrega o que eu preciso"*.

```typescript
constructor(private readonly prisma: PrismaService) {}
// "quando o NestJS me criar, me entrega um PrismaService pronto"
// private  → só acessível dentro dessa classe
// readonly → não pode ser reatribuído depois de criado
// o NestJS lê isso e resolve automaticamente
```

---

## Injeção de Dependência — na linguagem humana

É o NestJS criando e entregando as dependências automaticamente. Você não precisa instanciar nada na mão.

Na inicialização da aplicação, antes de qualquer requisição chegar:

```
1. NestJS lê todos os módulos
2. Vê que UsersController precisa de UsersService
3. Vê que UsersService precisa de PrismaService
4. Cria PrismaService primeiro
5. Cria UsersService passando o PrismaService
6. Cria UsersController passando o UsersService
7. Tudo pronto — começa a aceitar requisições
```

O constructor não executa nada no banco. Ele só **prepara** a classe pra usar o banco quando uma requisição chegar.

---

## Decorators — o que são aqueles `@`

Decorator é o `@` que aparece antes de classe e método. É o NestJS dizendo o que cada coisa é.

```typescript
@Controller('users')   →  "essa classe recebe requisições em /users"
@Injectable()          →  "essa classe pode ser injetada em outras"
@Module({...})         →  "essa classe é um módulo"
@Get()                 →  "esse método responde a GET"
@Post()                →  "esse método responde a POST"
@Body()                →  "pega o JSON que veio no corpo da requisição"
```

---

## async/await — na linguagem humana

Falar com banco leva tempo. Sem `async/await`, o código seguiria em frente antes do banco responder.

```typescript
// sem await — ERRADO
const user = prisma.user.create(...)  // não esperou terminar
console.log(user)                     // user está vazio

// com await — CORRETO
const user = await prisma.user.create(...)  // espera terminar
console.log(user)                           // user tem os dados
```

O `async` marca que a função tem operações demoradas. O `await` fala: *"para aqui e espera isso terminar antes de continuar"*.

Enquanto espera, o Node não fica travado — ele consegue atender outras requisições. Quando o banco responde, ele volta pra continuar de onde parou.

---

## Estrutura de pastas

```
helpdesk-api/
├── docker-compose.yml        # Postgres em container
├── prisma.config.ts          # Configuração do Prisma (conexão com banco)
├── prisma/
│   ├── schema.prisma         # Definição das tabelas (models)
│   └── migrations/           # Histórico de mudanças no banco
├── src/
│   ├── main.ts               # Entrada da aplicação
│   ├── app.module.ts         # Módulo raiz — registra todos os módulos
│   ├── prisma/               # Módulo de conexão com o banco
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   └── users/                # Módulo de usuários
│       ├── users.module.ts
│       ├── users.controller.ts
│       └── users.service.ts
```

---

## Subindo o projeto

```bash
# 1. Sobe o banco
docker compose up -d

# 2. Instala dependências
npm install

# 3. Gera o Prisma client
npx prisma generate

# 4. Roda as migrations
npx prisma migrate dev

# 5. Sobe o servidor
npm run start:dev
```

---

## Rotas disponíveis

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /users | Cadastra um novo usuário |

---

## Progresso

- [x] Setup do projeto com NestJS + TypeScript
- [x] PostgreSQL com Docker
- [x] Prisma com migrations
- [x] Módulo de usuários — cadastro com hash de senha
- [ ] Login com JWT
- [ ] Middleware de autenticação
- [ ] Módulo de tickets
- [ ] Docker da aplicação