import database from "infra/database.js";

async function status(request, response) {
  const updatedAt = new Date().toISOString();

  let result = await database.query("SELECT version();");
  const splitedResultDb = result.rows[0].version.split(" ");
  const dbVersion = parseFloat(splitedResultDb[1]);
  //pegando a versão do banco e colocando em String

  result = await database.query("SELECT current_setting('max_connections');");
  const maxConnections = parseFloat(result.rows[0].current_setting);
  //pegando o numero de conexões maximas

  result = await database.query("SELECT COUNT(*) FROM pg_stat_activity;");
  const usedConnections = parseFloat(result.rows[0].count);
  

  response.status(200).json({
    updated_at: updatedAt,
    database: {
      db_version: dbVersion,
      max_connections: maxConnections,
      used_connections: usedConnections,
    },
  });
}

export default status;
