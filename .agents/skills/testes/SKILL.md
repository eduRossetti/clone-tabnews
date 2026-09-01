---
name: testes
description: >-
  Use esta skill quando for solicitado a escrever, executar, corrigir, refatorar
  ou explicar testes de integração com Jest no clone-tabnews, utilizar o
  orchestrator.js, interpretar falhas de teste ou configurar novos cenários.
---

# Skill: Testes — clone-tabnews

## Stack de Testes

- **Framework**: Jest v30
- **Tipo atual**: Apenas testes de **integração** (não há testes unitários ainda)
- **Orchestrator**: [`tests/orchestrator.js`](file:///home/eduardorossetti/projetos/clone-tabnews/tests/orchestrator.js)

---

## Estrutura dos Testes

```
tests/
├── orchestrator.js                          ← Helper compartilhado
└── integration/
    └── api/
        └── v1/
            ├── status/
            │   ├── get.test.js              ← Testa GET /api/v1/status
            │   └── post.test.js             ← Testa POST /api/v1/status (erro esperado)
            └── migrations/
                ├── get.test.js              ← Testa GET /api/v1/migrations
                ├── post.test.js             ← Testa POST /api/v1/migrations
                └── delete.test.js          ← Testa DELETE /api/v1/migrations
```

> A estrutura de pastas dos testes **espelha** a estrutura das rotas da API.
> Isso facilita encontrar qual teste corresponde a qual endpoint.

---

## Como Rodar os Testes

```bash
# Rodar todos os testes (sobe o Docker, inicia Next.js, roda Jest, para serviços)
npm test

# Rodar em modo watch (para desenvolvimento — fica observando mudanças)
npm run test:watch
```

### O que acontece no `npm test`:

1. `services:up` — sobe o container do PostgreSQL
2. `concurrently` — inicia o servidor Next.js em background (`next dev`)
3. Jest aguarda o servidor estar pronto (via `orchestrator.waitForAllServices()`)
4. Jest roda todos os testes em sequência (`--runInBand`)
5. `posttest` — para os serviços Docker

---

## O Orchestrator

O [`tests/orchestrator.js`](file:///home/eduardorossetti/projetos/clone-tabnews/tests/orchestrator.js) é um **utilitário compartilhado** entre os testes.
Centraliza helpers que precisam ser usados em múltiplos arquivos de teste.

```js
// O que o orchestrator oferece:

// Espera o Next.js e o banco estarem prontos
await orchestrator.waitForAllServices();

// Limpa o banco entre testes (dropa e recria o schema public)
await orchestrator.cleanDatabase();
```

### Por que `cleanDatabase()` existe?

Testes de integração escrevem dados reais no banco. Sem limpeza, testes
anteriores contaminam os seguintes. O `cleanDatabase()` é chamado no
`beforeEach` ou `beforeAll` quando o teste precisa de um estado limpo.

---

## Anatomia de um Teste de Integração

```js
// tests/integration/api/v1/status/get.test.js
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices(); // Garante que tudo está de pé
});

describe("GET /api/v1/status", () => {
  // Agrupa por rota
  describe("Anonymous user", () => {
    // Agrupa por contexto/usuário
    test("Retrieving current system status", async () => {
      // 1. Faz a requisição HTTP real
      const response = await fetch("http://localhost:3000/api/v1/status");

      // 2. Verifica o status HTTP
      expect(response.status).toBe(200);

      // 3. Verifica o Content-Type
      expect(response.headers.get("content-type")).toContain(
        "application/json",
      );

      // 4. Deserializa o corpo
      const responseBody = await response.json();

      // 5. Verifica os campos do corpo
      expect(responseBody.updated_at).toBeDefined();
      expect(responseBody.dependencies.database.version).toBe("16.0");
    });
  });
});
```

---

## Boas Práticas de Teste neste Projeto

1. **Teste comportamento, não implementação**: Teste o que a API retorna, não como o Model foi implementado internamente.
2. **Um `describe` por rota, um `describe` por contexto**: Mantém os testes organizados e legíveis no output do Jest.
3. **`beforeAll` vs `beforeEach`**: Use `beforeAll` para setup caro (aguardar serviços). Use `beforeEach` para limpeza de banco quando os testes são interdependentes.
4. **Sempre teste os casos de erro também**: Ex: `post.test.js` testa que `POST /api/v1/status` retorna `405 Method Not Allowed`.

---

## Erros Comuns em Testes

| Erro                                   | Causa provável                             | Solução                                             |
| :------------------------------------- | :----------------------------------------- | :-------------------------------------------------- |
| `ECONNREFUSED localhost:3000`          | Next.js não está pronto ainda              | O orchestrator resolve isso com retry               |
| `Expected: 200 Received: 500`          | Banco fora do ar ou migration não aplicada | `npm run services:up && npm run migrations:up`      |
| `Timeout exceeded`                     | Serviço demorou mais que o retry suporta   | Ver se o Docker está rodando                        |
| Teste passa sozinho, falha em conjunto | Contaminação de dados entre testes         | Usar `orchestrator.cleanDatabase()` no `beforeEach` |

---

## Diferença: Unitário vs Integração

|                     | Unitário           | Integração                 |
| :------------------ | :----------------- | :------------------------- |
| **O que testa**     | Uma função isolada | O sistema de ponta a ponta |
| **Usa banco real?** | Não (mock)         | Sim                        |
| **Usa HTTP real?**  | Não                | Sim                        |
| **Velocidade**      | Muito rápido       | Mais lento                 |
| **Neste projeto**   | Ainda não tem      | É o tipo atual             |

O projeto foca em **testes de integração** porque valida o comportamento real
da API, incluindo banco de dados, middlewares e serialização HTTP.
