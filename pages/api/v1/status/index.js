import database from "infra/database.js";

async function status(request, response) {
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
}

export default status;
