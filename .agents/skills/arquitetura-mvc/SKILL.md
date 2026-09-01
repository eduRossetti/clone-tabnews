---
name: arquitetura-mvc
description: >-
  Use esta skill para estruturar, criar ou explicar componentes seguindo o padrão MVC do clone-tabnews (Models em models/, Controllers em pages/api/ e Views em pages/).
---

# Skill: Arquitetura MVC — clone-tabnews

## Contexto do Projeto

O `clone-tabnews` implementa uma variação do padrão **MVC (Model-View-Controller)**
adaptada para o Next.js. A separação não é imposta pelo framework — ela é uma
**decisão arquitetural consciente** do projeto.

---

## Mapa de Responsabilidades

### 🔵 Model — `models/`

- **Responsabilidade**: Toda a lógica relacionada a dados e regras de negócio.
- **O que faz**: queries SQL, validações de dados, cálculos, acesso ao banco.
- **O que NÃO faz**: não conhece `request`/`response` HTTP, não renderiza HTML.
- **Arquivos existentes**:
  - [`models/status.js`](file:///home/eduardorossetti/projetos/clone-tabnews/models/status.js) — consulta versão, conexões e status do banco.
  - [`models/migrator.js`](file:///home/eduardorossetti/projetos/clone-tabnews/models/migrator.js) — gerencia migrações do banco de dados.

### 🟡 Controller — `pages/api/` + `infra/controller.js`

- **Responsabilidade**: Orquestração HTTP — receber requisição, chamar o Model, devolver resposta.
- **O que faz**: define rotas, valida métodos HTTP, define status codes, trata erros globais.
- **O que NÃO faz**: não executa queries SQL diretamente, não renderiza HTML.
- **Arquivos existentes**:
  - [`pages/api/v1/status/index.js`](file:///home/eduardorossetti/projetos/clone-tabnews/pages/api/v1/status/index.js) — Controller da rota `/api/v1/status`.
  - [`pages/api/v1/migrations/index.js`](file:///home/eduardorossetti/projetos/clone-tabnews/pages/api/v1/migrations/index.js) — Controller da rota de migrations.
  - [`infra/controller.js`](file:///home/eduardorossetti/projetos/clone-tabnews/infra/controller.js) — Handlers de erro centralizados (`onError`, `onNoMatch`).

### 🟢 View — `pages/` (exceto `pages/api/`)

- **Responsabilidade**: Interface do usuário — renderização React, interação visual.
- **O que faz**: componentes React, busca dados via `fetch`/`useSWR`, exibe na tela.
- **O que NÃO faz**: não faz queries SQL, não conhece lógica de negócio.
- **Arquivos existentes**:
  - [`pages/index.js`](file:///home/eduardorossetti/projetos/clone-tabnews/pages/index.js) — Página inicial.
  - [`pages/status/index.js`](file:///home/eduardorossetti/projetos/clone-tabnews/pages/status/index.js) — Página que exibe status do sistema.

---

## Fluxo de Dados (Exemplo: GET /api/v1/status)

```
Usuário (browser)
     ↓  acessa /status
pages/status/index.js (VIEW)
     ↓  fetch("/api/v1/status")
pages/api/v1/status/index.js (CONTROLLER)
     ↓  status.getStatus()
models/status.js (MODEL)
     ↓  database.query(...)
PostgreSQL (banco de dados)
     ↑  dados retornados
models/status.js → monta objeto { version, connections, ... }
     ↑
pages/api/v1/status/index.js → response.status(200).json(...)
     ↑
pages/status/index.js → renderiza <span>Versão: 14.x</span>
```

---

## Regra Prática: Onde escrever o código novo?

| Preciso...                            | Escrevo em...             |
| :------------------------------------ | :------------------------ |
| Fazer uma nova query no banco         | `models/`                 |
| Criar uma nova rota de API            | `pages/api/v1/`           |
| Criar uma nova tela/componente        | `pages/` (fora de `api/`) |
| Centralizar tratamento de erro HTTP   | `infra/controller.js`     |
| Lógica de negócio (ex: calcular algo) | `models/`                 |

---

## Infra de suporte — `infra/`

A pasta `infra/` não é uma camada MVC — ela é **infraestrutura de suporte**:

- [`infra/database.js`](file:///home/eduardorossetti/projetos/clone-tabnews/infra/database.js) — Pool de conexões com o PostgreSQL.
- [`infra/errors.js`](file:///home/eduardorossetti/projetos/clone-tabnews/infra/errors.js) — Classes de erro customizadas (`ServiceError`, `InternalServerError`, etc).
- [`infra/controller.js`](file:///home/eduardorossetti/projetos/clone-tabnews/infra/controller.js) — Handlers de erro globais do `next-connect`.
