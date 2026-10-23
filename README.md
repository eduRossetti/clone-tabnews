# clone-tabnews

Implementação para treino do https://curso.dev

## Banco de dados

O projeto usa Prisma 6 com PostgreSQL. Em desenvolvimento, o Prisma lê a
`DATABASE_URL` de `.env.development` quando ela não está definida no ambiente.

- `npm run dev`: sobe o PostgreSQL local, aplica migrations pendentes e inicia o Next.js.
- `npm run migrations:create -- nome-da-migration`: cria e aplica uma migration local após alterar `prisma/schema.prisma`.
- `npm run migrations:up`: aplica as migrations já versionadas.
- `npm run build`: gera o Prisma Client, aplica migrations pendentes e compila o Next.js. A Vercel usa esse build com a `DATABASE_URL` configurada para o ambiente.

Ao trocar a estrutura antiga pela migration inicial do Prisma, reinicie o schema
`public` de staging e produção **somente depois de confirmar que ele não contém
outros dados a preservar**. Apagar só os registros não é suficiente: a tabela
`users` e a tabela de histórico `pgmigrations` antigas precisam ser removidas.
Faça o reset de cada ambiente imediatamente antes do primeiro deploy com Prisma.
Depois disso, o histórico passa a ser mantido em `_prisma_migrations`.

Confirme na Vercel que Preview/Staging e Production apontam para bancos distintos,
que ambos têm `DATABASE_URL` e que o Build Command não foi sobrescrito para
ignorar o script `build` do `package.json`. Nenhuma nova variável é necessária
quando a conexão atual do Neon funciona com `prisma migrate deploy`.

Se o PostgreSQL local ainda tiver a tabela `users` da estrutura antiga, reinicie
somente o banco local antes do primeiro `npm run dev`:

```sh
docker compose -f infra/compose.yaml down -v
```
