import bcrypt from "bcrypt";
import { ValidationError } from "infra/errors.js";

const saltRounds = process.env.NODE_ENV === "production" ? 14 : 1;

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
