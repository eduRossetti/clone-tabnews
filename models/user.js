import { Prisma } from "@prisma/client";
import prisma from "infra/prisma.js";
import { NotFoundError, ValidationError } from "infra/errors.js";
import password from "models/password.js";

const publicFields = {
  id: true,
  username: true,
  email: true,
  created_at: true,
  updated_at: true,
};

async function create(userInputValues) {
  const cleanUsername = userInputValues.username?.toLowerCase();
  const cleanEmail = userInputValues.email?.toLowerCase();

  await validateUniqueUsername(cleanUsername);
  await validateUniqueEmail(cleanEmail);

  const hashedPassword = await password.hash(userInputValues.password);

  try {
    return await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
      },
      select: publicFields,
    });
  } catch (error) {
    if (isUniqueViolation(error, "username")) throw usernameAlreadyInUse();
    if (isUniqueViolation(error, "email")) throw emailAlreadyInUse();
    throw error;
  }
}

async function findOneByUsername(username) {
  const cleanUsername = username?.toLowerCase();

  return prisma.user.findUnique({
    where: { username: cleanUsername },
    select: publicFields,
  });
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
    return await prisma.user.update({
      where: { id: existingUser.id },
      data: { username: cleanUsername },
      select: publicFields,
    });
  } catch (error) {
    if (isUniqueViolation(error, "username")) throw usernameAlreadyInUse();
    throw error;
  }
}

function isUniqueViolation(error, field) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    error.meta?.target?.includes(field)
  );
}

function usernameAlreadyInUse() {
  return new ValidationError({
    message: "O username informado já está sendo utilizado.",
    action: "Ajuste os dados e tente novamente.",
  });
}

function emailAlreadyInUse() {
  return new ValidationError({
    message: "O email informado já está sendo utilizado.",
    action: "Ajuste os dados e tente novamente.",
  });
}

async function validateUniqueUsername(username, excludedUserId = null) {
  const existingUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (existingUser && existingUser.id !== excludedUserId) {
    throw usernameAlreadyInUse();
  }
}

async function validateUniqueEmail(email) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) throw emailAlreadyInUse();
}

const user = {
  create,
  findOneByUsername,
  updateUsername,
};

export default user;
