---
name: nextjs-api
description: >-
  Use esta skill para criar, modificar, rotear ou explicar rotas de API no Next.js,
  utilizar next-connect, implementar métodos HTTP (GET, POST, etc.) e error handlers em infra/controller.js.
---

# Skill: Next.js API Routes — clone-tabnews

## Como Funcionam as API Routes no Next.js

No Next.js, qualquer arquivo dentro de `pages/api/` se torna automaticamente
um endpoint HTTP. A estrutura de pastas define a URL:

```
pages/api/v1/status/index.js   →  GET /api/v1/status
pages/api/v1/migrations/index.js → GET/POST /api/v1/migrations
```

O Next.js chama a função `default export` de cada arquivo passando `(request, response)`.

---

## O `next-connect` — Roteador de Métodos HTTP

O Next.js puro não tem roteamento por método HTTP nativo. O projeto usa
`next-connect` para isso:

```js
import { createRouter } from "next-connect";
import controller from "infra/controller";
import status from "models/status";

const router = createRouter();

router.get(getHandler); // Registra handler apenas para GET

// Exporta com os error handlers centralizados
export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const systemStatus = await status.getStatus();
  return response.status(200).json(systemStatus);
}
```

### Por que `router.handler(controller.errorHandlers)`?

O `handler()` do `next-connect` transforma o router em uma função compatível
com o Next.js. Os `errorHandlers` são callbacks que o `next-connect` chama
automaticamente quando:

- A rota não tem método para a requisição → `onNoMatch` → 405
- O handler lança uma exceção → `onError` → 500

---

## O `infra/controller.js` — Error Handler Centralizado

```js
// infra/controller.js
function onErrorHandler(error, request, response) {
  const publicErrorObject = new InternalServerError({
    statusCode: error.statusCode,
    cause: error,
  });
  console.error(publicErrorObject);
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowledError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}
```

**Por que centralizar?** Sem isso, cada rota teria que ter seu próprio try/catch
e lógica de resposta de erro. O `controller.js` garante que **qualquer** rota do
projeto responda erros no mesmo formato JSON.

---

## Classes de Erro — `infra/errors.js`

O projeto tem 3 classes de erro customizadas:

| Classe                   | Status | Quando usar                                            |
| :----------------------- | :----: | :----------------------------------------------------- |
| `InternalServerError`    |  500   | Erros inesperados (capturado pelo `onError`)           |
| `MethodNotAllowledError` |  405   | Método HTTP não suportado (capturado pelo `onNoMatch`) |
| `ServiceError`           |  503   | Serviço externo indisponível (ex: banco fora do ar)    |

Todas implementam `.toJSON()` para serializar corretamente via `response.json()`.

---

## Como Criar uma Nova Rota de API

### Passo 1: Criar o arquivo

```
pages/api/v1/minha-rota/index.js
```

### Passo 2: Estrutura padrão

```js
import { createRouter } from "next-connect";
import controller from "infra/controller";
import meuModel from "models/meu-model"; // Importa o Model

const router = createRouter();

router.get(getHandler);
// router.post(postHandler);  // Adicione outros métodos conforme necessário

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const dados = await meuModel.buscarDados();
  return response.status(200).json(dados);
}
```

### Passo 3: Criar o Model correspondente

A lógica de negócio vai em `models/meu-model.js`, não no handler.

---

## Lendo Dados da Requisição

```js
// Query string: GET /api/v1/status?page=2
const page = request.query.page;

// Corpo da requisição (POST/PUT com JSON)
const body = request.body; // Next.js já faz o parse automaticamente

// Cabeçalhos
const authHeader = request.headers.authorization;
```

---

## Padrão de Resposta HTTP do Projeto

Todos os endpoints seguem o mesmo padrão:

```js
// Sucesso
response.status(200).json({ dados: "..." });
response.status(201).json({ criado: "..." });

// Erro (gerenciado automaticamente pelo controller.errorHandlers)
// { name, message, action, statusCode }
```

---

## Middlewares com `next-connect`

Para adicionar middleware (ex: autenticação) em uma rota específica:

```js
router.use(middlewareDeAutenticacao); // Roda antes de todos os handlers
router.get(getHandler);
```

Para middleware global, adicionar no `infra/controller.js`.
