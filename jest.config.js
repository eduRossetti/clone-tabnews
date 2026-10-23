const nextJest = require("next/jest");
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
dotenvExpand.expand(
  dotenv.config({
    path: ".env.development",
    quiet: true,
  }),
); // seta que o jest deve olhar para o env de "development" e não de "test"

const createJestConfig = nextJest({
  dir: ".",
});

const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
  testTimeout: 60000,
});

module.exports = jestConfig;
