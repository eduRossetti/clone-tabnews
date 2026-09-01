---
name: docker
description: >-
  Use esta skill para gerenciar, executar comandos, debugar ou explicar containers
  Docker, Docker Compose (infra/compose.yaml), volumes, networking e serviços no clone-tabnews.
---

# Skill: Docker — clone-tabnews

## Visão Geral

O projeto usa Docker **apenas para infraestrutura de desenvolvimento** — banco
de dados PostgreSQL. A aplicação Next.js roda diretamente no Node local (`npm run dev`),
não dentro de um container.

---

## O arquivo `infra/compose.yaml`

```yaml
services:
  database:
    container_name: "postgres-dev"
    image: "postgres:16.0-alpine3.18"
    env_file:
      - ../.env.development
    ports:
      - "5432:5432"
```

### Lendo o compose linha por linha:

| Campo                               | O que significa                                                  |
| :---------------------------------- | :--------------------------------------------------------------- |
| `services.database`                 | Nome lógico do serviço (como você o referencia no compose)       |
| `container_name: "postgres-dev"`    | Nome real do container no Docker (aparece no `docker ps`)        |
| `image: "postgres:16.0-alpine3.18"` | Imagem oficial do PostgreSQL 16.0 (Alpine = mais leve)           |
| `env_file: ../.env.development`     | Injeta as variáveis de ambiente do arquivo `.env.development`    |
| `ports: "5432:5432"`                | Mapeia a porta do container para a máquina host (host:container) |

> **Por que `../.env.development`?** O compose.yaml está em `infra/`, então precisa
> subir um nível (`../`) para alcançar o `.env.development` na raiz do projeto.

---

## Comandos do Projeto

Os comandos Docker são encapsulados em scripts do `package.json`:

```bash
# Subir os containers em background (-d = detached)
npm run services:up
# Equivale a: docker compose -f infra/compose.yaml up -d

# Parar os containers (preserva dados)
npm run services:stop
# Equivale a: docker compose -f infra/compose.yaml stop

# Parar E remover os containers (dados do volume são perdidos)
npm run services:down
# Equivale a: docker compose -f infra/compose.yaml down
```

### Diferença importante: `stop` vs `down`

| Comando            | O que faz                        |           Dados preservados?           |
| :----------------- | :------------------------------- | :------------------------------------: |
| `services:stop`    | Para o container, mantém volumes |                 ✅ Sim                 |
| `services:down`    | Para E remove container e rede   | ✅ Sim (volumes explícitos sobrevivem) |
| `services:down -v` | Remove tudo, incluindo volumes   |                 ❌ Não                 |

---

## Comandos Docker Úteis (Diretos)

```bash
# Ver containers rodando
docker ps

# Ver logs do banco em tempo real
docker logs postgres-dev -f

# Entrar no container do banco (shell interativo)
docker exec -it postgres-dev bash

# Conectar ao PostgreSQL dentro do container
docker exec -it postgres-dev psql -U local_user -d local_db

# Ver o status do compose
docker compose -f infra/compose.yaml ps
```

---

## Fluxo do `npm run dev`

O script de desenvolvimento faz tudo automaticamente:

```bash
npm run services:up              # 1. Sobe o container do Postgres
  && npm run services:wait:database  # 2. Aguarda o banco estar pronto (scripts/wait-for-postgres.js)
  && npm run migrations:up       # 3. Aplica migrations pendentes
  && next dev                    # 4. Sobe o servidor Next.js
```

> **Por que esperar o banco?** O Docker pode reportar o container como "rodando"
> antes do PostgreSQL estar pronto para aceitar conexões. O script
> `infra/scripts/wait-for-postgres.js` tenta conectar em loop até conseguir.

---

## Networking

No Docker Compose, todos os serviços de um mesmo arquivo compartilham uma **rede
interna padrão**. Porém, como o Next.js roda fora do Docker, a comunicação
acontece via `localhost:5432` (porta mapeada no `ports`).

```
Next.js (host) ──→ localhost:5432 ──→ [Docker] postgres-dev:5432
```

Se a aplicação também estivesse em um container, usaria o nome do serviço:

```
app_container ──→ database:5432  (pelo nome do serviço no compose)
```

---

## Problemas Comuns

| Problema                          | Causa                             | Solução                                    |
| :-------------------------------- | :-------------------------------- | :----------------------------------------- |
| `ECONNREFUSED 127.0.0.1:5432`     | Container não está rodando        | `npm run services:up`                      |
| Container trava no "health check" | Postgres ainda inicializando      | Aguardar ou ver `docker logs postgres-dev` |
| Porta 5432 já em uso              | Outro Postgres rodando localmente | `sudo lsof -i :5432` e matar o processo    |
| Dados sumiram                     | Usado `services:down` com `-v`    | Rodar `migrations:up` novamente            |
