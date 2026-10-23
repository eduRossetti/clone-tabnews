const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { ensureDatabaseUrl } = require("../database-url.cjs");

const isHostedBuild =
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.NODE_ENV === "production";

ensureDatabaseUrl();

if (!process.env.DATABASE_URL) {
  if (!isHostedBuild) {
    const dotenv = require("dotenv");
    const dotenvExpand = require("dotenv-expand");
    dotenvExpand.expand(
      dotenv.config({ path: ".env.development", quiet: true }),
    );
    ensureDatabaseUrl();
  }
}

if (!process.env.DATABASE_URL) {
  console.error(
    "Banco não configurado: defina DATABASE_URL ou POSTGRES_HOST, POSTGRES_USER, POSTGRES_DB e POSTGRES_PASSWORD neste ambiente.",
  );
  process.exit(1);
}

if (isHostedBuild && process.env.DATABASE_URL) {
  const hostname = new URL(process.env.DATABASE_URL).hostname;

  if (["localhost", "127.0.0.1", "[::1]"].includes(hostname)) {
    console.error(
      "DATABASE_URL aponta para o PostgreSQL local, inacessível neste build. Configure a URL do Neon no ambiente correto da Vercel.",
    );
    process.exit(1);
  }
}

const prismaBinary = path.join(
  process.cwd(),
  "node_modules",
  "prisma",
  "build",
  "index.js",
);
const result = spawnSync(
  process.execPath,
  [prismaBinary, ...process.argv.slice(2)],
  {
    env: process.env,
    stdio: "inherit",
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
