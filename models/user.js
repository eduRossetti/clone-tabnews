import database from "infra/database.js";
import { NotFoundError, ValidationError } from "infra/errors.js";
import password from "models/password.js";

async function create(userInputValues) {
  const cleanUsername = userInputValues.username?.toLowerCase();
  const cleanEmail = userInputValues.email?.toLowerCase();

  await validateUniqueUsername(cleanUsername);
  await validateUniqueEmail(cleanEmail);

  const hashedPassword = await password.hash(userInputValues.password);

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

async function updateUsername(currentUsername, userInputValues) {
  const existingUser = await findOneByUsername(currentUsername);

  if (!existingUser) {
    throw new NotFoundError({
      message: `O usuário "${currentUsername}" não foi encontrado.`,
      action: "Verifique se o nome de usuário está digitado corretamente.",
    });
  }

  const username = userInputValues?.username;
  const cleanUsername =
    typeof username === "string" ? username.toLowerCase() : undefined;

  if (
    !cleanUsername ||
    !cleanUsername.trim() ||
    [...cleanUsername].length > 30
  ) {
    throw new ValidationError({
      message: "O username deve ser uma string não vazia de até 30 caracteres.",
      action: "Informe um username válido e tente novamente.",
    });
  }

  await validateUniqueUsername(cleanUsername, existingUser.id);

  try {
    const results = await database.query({
      text: `
        UPDATE users
        SET username = $1, updated_at = now()
        WHERE id = $2
        RETURNING id, username, email, created_at, updated_at;
      `,
      values: [cleanUsername, existingUser.id],
    });

    return results.rows[0];
  } catch (error) {
    if (
      error.cause?.code === "23505" &&
      error.cause?.constraint === "users_username_key"
    ) {
      throw usernameAlreadyInUse();
    }
    throw error;
  }
}

function usernameAlreadyInUse() {
  return new ValidationError({
    message: "O username informado já está sendo utilizado.",
    action: "Ajuste os dados e tente novamente.",
  });
}

async function validateUniqueUsername(username, excludedUserId = null) {
  const results = await database.query({
    text: `
      SELECT
        username
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
        AND ($2::uuid IS NULL OR id <> $2::uuid);
    `,
    values: [username, excludedUserId],
  });

  if (results.rowCount > 0) {
    throw usernameAlreadyInUse();
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
  findOneByUsername,
  updateUsername,
};

export default user;
