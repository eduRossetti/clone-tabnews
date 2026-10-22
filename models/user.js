import database from "infra/database.js";
import { ValidationError } from "infra/errors.js";
import bcrypt from "bcrypt";

async function create(userInputValues) {
  const cleanUsername = userInputValues.username?.toLowerCase();
  const cleanEmail = userInputValues.email?.toLowerCase();

  await validateUniqueUsername(cleanUsername);
  await validateUniqueEmail(cleanEmail);

  const hashedPassword = await hashPassword(userInputValues.password);

  const results = await database.query({
    text: `
      INSERT INTO
        users (username, email, password)
      VALUES
        ($1, $2, $3)
      RETURNING
        *;
    `,
    values: [cleanUsername, cleanEmail, hashedPassword],
  });

  return results.rows[0];
}

async function findOneByUsername(username) {
  const cleanUsername = username?.toLowerCase();

  const results = await database.query({
    text: `
    SELECT
      id,
      username,
      email,
      created_at,
      updated_at
    FROM
      users
    WHERE
      LOWER(username) = $1;
    `,
    values: [cleanUsername],
  });

  return results.rows[0];
}

async function validateUniqueUsername(username) {
  const results = await database.query({
    text: `
      SELECT
        username
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1);
    `,
    values: [username],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O username informado já está sendo utilizado.",
      action: "Ajuste os dados e tente novamente.",
    });
  }
}

async function validateUniqueEmail(email) {
  const results = await database.query({
    text: `
      SELECT
        email
      FROM
        users
      WHERE
        LOWER(email) = LOWER($1);
    `,
    values: [email],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O email informado já está sendo utilizado.",
      action: "Ajuste os dados e tente novamente.",
    });
  }
}

async function hashPassword(rawPassword) {
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

  return bcrypt.hash(rawPassword, 14);
}

const user = {
  create,
  findOneByUsername,
};

export default user;
