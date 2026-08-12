import database from "infra/database.js";
import { ServiceError } from "infra/errors.js";

async function getStatus() {
  try {
    const updatedAt = new Date().toISOString();

    const databaseVersionResult = await database.query("SHOW server_version;");
    const databaseVersionValue = databaseVersionResult.rows[0].server_version;

    const databaseMaxConnectionsResult = await database.query(
      "SELECT current_setting('max_connections');",
    );
    const databaseMaxConnectionsValue =
      databaseMaxConnectionsResult.rows[0].current_setting;

    const databaseName = process.env.POSTGRES_DB;
    const databaseUsedConnectionsResult = await database.query({
      text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
      values: [databaseName],
    });
    const databaseUsedConnectionsValue =
      databaseUsedConnectionsResult.rows[0].count;

    return {
      updated_at: updatedAt,
      dependencies: {
        database: {
          version: databaseVersionValue,
          max_connections: parseInt(databaseMaxConnectionsValue),
          used_connections: databaseUsedConnectionsValue,
        },
      },
    };
  } catch (error) {
    const publicErrorObject = new ServiceError({
      cause: error,
      message: "Erro ao obter o status do banco de dados.",
    });
    throw publicErrorObject;
  }
}

const status = {
  getStatus,
};

export default status;