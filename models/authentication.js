import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import prisma from "infra/prisma.js";
import { UnauthorizedError, ValidationError } from "infra/errors.js";

const sessionDurationInSeconds = 30 * 24 * 60 * 60;

async function createSession(input) {
  const email = input?.email;
  const rawPassword = input?.password;

  if (typeof email !== "string" || email.trim().length === 0) {
    throw new ValidationError({
      message: "O email deve ser uma string não vazia.",
      action: "Informe um email válido e tente novamente.",
    });
  }

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

  const foundUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, password: true },
  });

  if (!foundUser || !(await bcrypt.compare(rawPassword, foundUser.password))) {
    throw new UnauthorizedError();
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + sessionDurationInSeconds * 1000);

  const session = await prisma.session.create({
    data: {
      user_id: foundUser.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    },
  });

  return {
    token,
    expires_at: session.expires_at,
  };
}

const authentication = {
  createSession,
  sessionDurationInSeconds,
};

export default authentication;
