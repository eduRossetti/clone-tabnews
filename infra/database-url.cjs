function ensureDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return;
  }

  const {
    POSTGRES_HOST,
    POSTGRES_PORT,
    POSTGRES_USER,
    POSTGRES_DB,
    POSTGRES_PASSWORD,
    PGHOST,
    PGPORT,
    PGUSER,
    PGDATABASE,
    PGPASSWORD,
  } = process.env;

  const host = POSTGRES_HOST || PGHOST;
  const port = POSTGRES_PORT || PGPORT || "5432";
  const user = POSTGRES_USER || PGUSER;
  const database = POSTGRES_DB || PGDATABASE;
  const password = POSTGRES_PASSWORD || PGPASSWORD;

  if (!host || !user || !database || !password) {
    return;
  }

  const url = new URL("postgresql://localhost");
  url.hostname = host;
  url.port = port;
  url.username = user;
  url.password = password;
  url.pathname = `/${encodeURIComponent(database)}`;

  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    url.searchParams.set("sslmode", "require");
  }

  process.env.DATABASE_URL = url.toString();
}

module.exports = { ensureDatabaseUrl };
