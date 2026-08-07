import { runner as migrationRunner } from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database";
import { createRouter } from "next-connect";
import controller from "infra/controller";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

const defaultMigrationsOptions = {
  databaseUrl: process.env.DATABASE_URL, // credenciais de acesso do banco
  dryRun: true, // se vai rodar de verdade ou só vai testar o que rodaria
  dir: join("infra", "migrations"), //caminho de onde estão as migrations
  direction: "up",
  verbose: true, //mostra mais informações(SQL) sobre as migrations quando executada
  migrationsTable: "pgmigrations", //qual tabela vai ser usada pra controlar as migrations
};

async function postHandler(request, response) {
  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const migratedMigrations = await migrationRunner({
      ...defaultMigrationsOptions,
      dryRun: false,
      dbClient,
    });

    await dbClient.end();

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }

    return response.status(200).json(migratedMigrations);
    // retorna um array com todas as migrations que foram executadas
  } finally {
    await dbClient.end();
  }
}
async function getHandler(request, response) {
  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const pendingMigrations = await migrationRunner({
      ...defaultMigrationsOptions,
      dbClient,
    });
    await dbClient.end();

    return response.status(200).json(pendingMigrations);
  } finally {
    await dbClient?.end();
  }
}
