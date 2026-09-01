---
name: banco-de-dados
description: >-
  Use esta skill para criar, executar, depurar ou explicar queries SQL, conexões PostgreSQL,
  migrations (node-pg-migrate), models de banco e infra/database.js no clone-tabnews.
---

# Skill: Banco de Dados — clone-tabnews

## Stack de Banco de Dados

- **Banco**: PostgreSQL 16.0 (via Docker, imagem `postgres:16.0-alpine3.18`)
- **Driver Node.js**: `pg` (biblioteca oficial do PostgreSQL para Node)
- **Migrations**: `node-pg-migrate` v8
- **Abstração de conexão**: [`infra/database.js`](file:///home/eduardorossetti/projetos/clone-tabnews/infra/database.js)

---

## Como a Conexão Funciona

O projeto **não usa pool permanente de conexões**. Cada query abre um `Client` novo
e fecha no `finally`. Isso é simples e funciona para o volume do projeto.

```js
// infra/database.js — fluxo de uma query
async function query(queryObject) {
  let client;
  try {
    client = await getNewClient();      // 1. Abre nova conexão
    const result = await client.query(queryObject); // 2. Executa query
    return result;                       // 3. Retorna resultado
  } catch (error) {
    throw new ServiceError({ ... });     // 4. Encapsula erro
  } finally {
    await client?.end();                 // 5. SEMPRE fecha a conexão
  }
}
```

> **Por que `client?.end()` no `finally`?** O `finally` roda mesmo se der erro.
> O `?.` (optional chaining) evita crash se `client` for undefined (caso a conexão
> nem tenha sido aberta).

---

## Variáveis de Ambiente

Todas as credenciais ficam em `.env.development`. **Nunca** hardcode.

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=local_user
POSTGRES_PASSWORD=local_password
POSTGRES_DB=local_db
```

O arquivo `getNewClient()` lê essas variáveis via `process.env.*`.

### SSL

```js
function getSSLValues() {
  if (process.env.POSTGRES_CA) return { ca: process.env.POSTGRES_CA }; // produção com cert
  return process.env.NODE_ENV === "production" ? true : false; // dev = sem SSL
}
```

---

## Queries — Boas Práticas

### Forma simples (string):

```js
await database.query("SHOW server_version;");
```

### Forma parametrizada (OBRIGATÓRIA com dados do usuário):

```js
await database.query({
  text: "SELECT count(*) FROM pg_stat_activity WHERE datname = $1;",
  values: [process.env.POSTGRES_DB],
});
```

> **Por que `$1` em vez de string interpolada?**
> Evita **SQL Injection**. O driver `pg` trata o valor como parâmetro separado,
> nunca como parte da string SQL. Exemplo perigoso que NÃO deve ser feito:
>
> ```js
> // ❌ NUNCA FAÇA ISSO
> await database.query(`SELECT * FROM users WHERE name = '${userName}'`);
> ```

---

## Migrations

### O que é uma Migration?

Uma migration é um arquivo que descreve uma mudança no schema do banco de dados
(ex: criar uma tabela, adicionar uma coluna). São versionadas e aplicadas em ordem.

### Comandos

```bash
# Criar nova migration
npm run migrations:create -- nome-da-migration

# Aplicar todas as migrations pendentes
npm run migrations:up
```

### Onde ficam os arquivos:

```
infra/migrations/
├── 1700000000000_create-users-table.js
├── 1700000000001_add-email-to-users.js
└── ...
```

### Estrutura de uma migration:

```js
// infra/migrations/TIMESTAMP_descricao.js
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("users", {
    id: { type: "serial", primaryKey: true },
    email: { type: "varchar(255)", notNull: true, unique: true },
    created_at: { type: "timestamp", default: pgm.func("now()") },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("users");
};
```

---

## Erros Comuns e Como Identificar

| Erro                               | Causa provável           | Como debugar                |
| :--------------------------------- | :----------------------- | :-------------------------- |
| `ECONNREFUSED`                     | Banco não está rodando   | `npm run services:up`       |
| `password authentication failed`   | `.env` incorreto         | Conferir `.env.development` |
| `relation "X" does not exist`      | Migration não aplicada   | `npm run migrations:up`     |
| `ServiceError: Erro na conexão...` | Erro encapsulado do `pg` | Ler `error.cause` no log    |

---

## Onde o Banco Aparece na Arquitetura

```
models/*.js           ← usa database.query()
    ↓
infra/database.js     ← abre Client, executa query, fecha Client
    ↓
PostgreSQL (Docker)   ← banco real
    ↓ configurado por
infra/compose.yaml    ← define o container
.env.development      ← credenciais de acesso
```
