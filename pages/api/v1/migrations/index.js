import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database";

export default async function migrations(request, response) {
  const allowedMethods = ["GET", "POST"];

  if (!allowedMethods.includes(request.method)) {
    return response.status(405).json({
      error: `Method ${request.method} not allowed`,
    });
  }

  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const defaultMigrationsOptions = {
      dbClient: dbClient,
      databaseUrl: process.env.DATABASE_URL, // credenciais de acesso do banco
      dryRun: true, // se vai rodar de verdade ou só vai testar o que rodaria
      dir: join("infra", "migrations"), //caminho de onde estão as migrations
      direction: "up",
      verbose: true, //mostra mais informações(SQL) sobre as migrations quando executada
      migrationsTable: "pgmigrations", //qual tabela vai ser usada pra controlar as migrations
    };

    if (request.method === "GET") {
      const pendingMigrations = await migrationRunner(defaultMigrationsOptions);
      await dbClient.end();

      return response.status(200).json(pendingMigrations);
    }

    if (request.method === "POST") {
      const migratedMigrations = await migrationRunner({
        ...defaultMigrationsOptions,
        dryRun: false,
      });

      await dbClient.end();

      if (migratedMigrations.length > 0) {
        return response.status(201).json(migratedMigrations);
      }

      return response.status(200).json(migratedMigrations);
      // retorna um array com todas as migrations que foram executadas
    }
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await dbClient.end();
  }
}
