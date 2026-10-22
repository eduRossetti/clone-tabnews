import bcrypt from "bcrypt";
import { ValidationError } from "infra/errors.js";

// Bcrypt requires a minimum cost of 4; use it outside production for faster tests.
const saltRounds = process.env.NODE_ENV === "production" ? 14 : 4;

async function hash(rawPassword) {
  if (
    typeof rawPassword !== "string" ||
    rawPassword.length === 0 ||
    Buffer.byteLength(rawPassword, "utf8") > 72
  ) {
    throw new ValidationError({
      message: "A senha deve ser uma string não vazia de até 72 bytes.",
      action: "Informe uma senha válida e tente novamente.",
    });
  }

  return bcrypt.hash(rawPassword, saltRounds);
}

const password = {
  hash,
};

export default password;
