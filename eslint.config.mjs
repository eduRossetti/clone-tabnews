import nextConfig from "eslint-config-next";
import jestPlugin from "eslint-plugin-jest";
import eslintConfigPrettier from "eslint-config-prettier";

const config = [
  ...nextConfig,
  jestPlugin.configs["flat/recommended"],
  eslintConfigPrettier,
];

export default config;
