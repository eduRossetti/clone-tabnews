import { createRouter } from "next-connect";
import database from "infra/database.js";
import { InternalServerError, MethodNotAllowledError } from "infra/errors";
import controller from "infra/controller";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  try {
    const updatedAt = new Date().toISOString();

    let databaseVersionResult = await database.query("SHOW server_version;");
    const databaseVersionValue = databaseVersionResult.rows[0].server_version;

    //pegando a versão do banco e colocando em String

    const databaseMaxConnectionsResult = await database.query(
      "SELECT current_setting('max_connections');",
    );
    const databaseMaxConnectionsValue =
      databaseMaxConnectionsResult.rows[0].current_setting;
    //pegando o numero de conexões maximas

    const databaseName = process.env.POSTGRES_DB;
    const databaseUsedConnectionsResult = await database.query({
      text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
      values: [databaseName],
    });
    const databaseUsedConnectionsValue =
      databaseUsedConnectionsResult.rows[0].count;

    response.status(200).json({
      updated_at: updatedAt,
      dependencies: {
        database: {
          version: databaseVersionValue,
          max_connections: parseInt(databaseMaxConnectionsValue),
          used_connections: databaseUsedConnectionsValue,
        },
      },
    });
  } catch (error) {
    console.log("\n Erro dentro do catch do controller:");
    const publicErrorObject = new InternalServerError({
      statusCode: error.statusCode,
      cause: error,
    });
    console.error(publicErrorObject);

    response.status(500).json(publicErrorObject);
  }
}
