import database from "infra/database.js";
import { ValidationError } from "infra/errors.js";

async function create(userInputValues) {
  const cleanUsername = userInputValues.username?.toLowerCase();
  const cleanEmail = userInputValues.email?.toLowerCase();
  const cleanPassword = userInputValues.password;

  await validateUniqueUsername(cleanUsername);
  await validateUniqueEmail(cleanEmail);

  const results = await database.query({
    text: `
      INSERT INTO
        users (username, email, password)
      VALUES
        ($1, $2, $3)
      RETURNING
        *;
    `,
    values: [cleanUsername, cleanEmail, cleanPassword],
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

const user = {
  create,
};

export default user;
