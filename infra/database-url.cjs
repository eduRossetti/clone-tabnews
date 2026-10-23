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
  } = process.env;

  if (!POSTGRES_HOST || !POSTGRES_USER || !POSTGRES_DB || !POSTGRES_PASSWORD) {
    return;
  }

  const url = new URL("postgresql://localhost");
  url.hostname = POSTGRES_HOST;
  url.port = POSTGRES_PORT || "5432";
  url.username = POSTGRES_USER;
  url.password = POSTGRES_PASSWORD;
  url.pathname = `/${encodeURIComponent(POSTGRES_DB)}`;

  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    url.searchParams.set("sslmode", "require");
  }

  process.env.DATABASE_URL = url.toString();
}

module.exports = { ensureDatabaseUrl };
