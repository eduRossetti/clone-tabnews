import { runner as migrationRunner } from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database";
import { ServiceError } from "infra/errors.js";

const defaultMigrationsOptions = {
  databaseUrl: process.env.DATABASE_URL, // credenciais de acesso do banco
  dryRun: true, // se vai rodar de verdade ou só vai testar o que rodaria
  dir: join("infra", "migrations"), //caminho de onde estão as migrations
  direction: "up",
  verbose: true, //mostra mais informações(SQL) sobre as migrations quando executada
  migrationsTable: "pgmigrations", //qual tabela vai ser usada pra controlar as migrations
};

async function listPendingMigrations() {
  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const pendingMigrations = await migrationRunner({
      ...defaultMigrationsOptions,
      dbClient,
    });

    return pendingMigrations;
  } finally {
    await dbClient?.end();
  }
}

async function runPendingMigrations() {
  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const migratedMigrations = await migrationRunner({
      ...defaultMigrationsOptions,
      dryRun: false,
      dbClient,
    });

    return migratedMigrations;
  } catch (error) {
    const publicErrorObject = new ServiceError({
      cause: error,
      message: "Erro ao rodar as migrations",
    });
    throw publicErrorObject;
  } finally {
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
