const { spawnSync } = require("node:child_process");
const path = require("node:path");

if (!process.env.DATABASE_URL) {
  const dotenv = require("dotenv");
  const dotenvExpand = require("dotenv-expand");
  dotenvExpand.expand(dotenv.config({ path: ".env.development", quiet: true }));
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
