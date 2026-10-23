# clone-tabnews

Implementação para treino do https://curso.dev

## Banco de dados

O projeto usa Prisma 6 com PostgreSQL. Se `DATABASE_URL` não estiver definida,
ele a monta a partir das variáveis `POSTGRES_HOST`, `POSTGRES_PORT`,
`POSTGRES_USER`, `POSTGRES_DB` e `POSTGRES_PASSWORD` que a aplicação já usava.
Em desenvolvimento, esses valores podem vir de `.env.development`.

- `npm run dev`: sobe o PostgreSQL local, aplica migrations pendentes e inicia o Next.js.
- `npm run migrations:create -- nome-da-migration`: cria e aplica uma migration local após alterar `prisma/schema.prisma`.
- `npm run migrations:up`: aplica as migrations já versionadas.
- `npm run build`: gera o Prisma Client, aplica migrations pendentes e compila o Next.js. A Vercel usa as variáveis de banco configuradas para o ambiente.

Ao trocar a estrutura antiga pela migration inicial do Prisma, reinicie o schema
`public` de staging e produção **somente depois de confirmar que ele não contém
outros dados a preservar**. Apagar só os registros não é suficiente: a tabela
`users` e a tabela de histórico `pgmigrations` antigas precisam ser removidas.
Faça o reset de cada ambiente imediatamente antes do primeiro deploy com Prisma.
Depois disso, o histórico passa a ser mantido em `_prisma_migrations`.

Confira em **Settings > Environment Variables** da Vercel se Preview aponta
para o Neon de staging e Production para o Neon de produção. As variáveis
`POSTGRES_*` existentes continuam válidas; `DATABASE_URL` é opcional e, se
existir, tem prioridade. As variáveis de Production não são usadas
automaticamente nos builds de Preview. Depois de alterar uma variável, inicie
um novo deploy para que ele receba o valor atualizado. Confirme também que o
Build Command não foi sobrescrito para ignorar o script `build` do
`package.json`.

Se o PostgreSQL local ainda tiver a tabela `users` da estrutura antiga, reinicie
somente o banco local antes do primeiro `npm run dev`:

```sh
docker compose -f infra/compose.yaml down -v
```
