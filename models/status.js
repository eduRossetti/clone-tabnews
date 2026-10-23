import prisma from "infra/prisma.js";
import { ServiceError } from "infra/errors.js";

async function getStatus() {
  try {
    const updatedAt = new Date().toISOString();

    const [databaseStatus] = await prisma.$queryRaw`
      SELECT
        current_setting('server_version') AS version,
        current_setting('max_connections')::int AS max_connections,
        (
          SELECT count(*)::int
          FROM pg_stat_activity
          WHERE datname = current_database()
        ) AS used_connections;
    `;

    return {
      updated_at: updatedAt,
      dependencies: {
        database: {
          version: databaseStatus.version,
          max_connections: databaseStatus.max_connections,
          used_connections: databaseStatus.used_connections,
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
