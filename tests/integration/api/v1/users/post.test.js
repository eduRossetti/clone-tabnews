import bcrypt from "bcrypt";
import prisma from "infra/prisma.js";
import orchestrator from "tests/orchestrator.js";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatabase();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "validuser",
          email: "validuser@example.com",
          password: "validpassword",
        }),
      });
      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "validuser",
        email: "validuser@example.com",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(responseBody).not.toHaveProperty("password");

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.created_at).toBeDefined();
      expect(responseBody.updated_at).toBeDefined();

      const parsedCreatedAt = new Date(responseBody.created_at).toISOString();
      expect(responseBody.created_at).toEqual(parsedCreatedAt);

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

      const userRow = await prisma.user.findUnique({
        where: { id: responseBody.id },
      });
      expect(userRow).not.toBeNull();
      expect(userRow.id).toBe(responseBody.id);
      expect(userRow.username).toBe("validuser");
      expect(userRow.email).toBe("validuser@example.com");
      expect(userRow.password).not.toBe("validpassword");
      expect(userRow.password).toHaveLength(60);
      expect(bcrypt.getRounds(userRow.password)).toBe(4);
      expect(await bcrypt.compare("validpassword", userRow.password)).toBe(
        true,
      );
      expect(await bcrypt.compare("wrongpassword", userRow.password)).toBe(
        false,
      );
    });

    test("With the same password for different users", async () => {
      const hashes = [];

      for (const username of ["samepassword1", "samepassword2"]) {
        const response = await createUser(username, "sharedpassword");
        expect(response.status).toBe(201);
        const responseBody = await response.json();
        expect(responseBody).not.toHaveProperty("password");

        const result = await prisma.user.findUnique({
          where: { id: responseBody.id },
          select: { password: true },
        });
        const hash = result.password;
        expect(bcrypt.getRounds(hash)).toBe(4);
        expect(await bcrypt.compare("sharedpassword", hash)).toBe(true);
        hashes.push(hash);
      }

      expect(hashes[0]).not.toBe(hashes[1]);
    });

    test("Preserving password case and spaces", async () => {
      const originalPassword = "  MixedCase Password  ";
      const response = await createUser("exactpassword", originalPassword);
      expect(response.status).toBe(201);
      const responseBody = await response.json();
      const result = await prisma.user.findUnique({
        where: { id: responseBody.id },
        select: { password: true },
      });
      const hash = result.password;

      expect(await bcrypt.compare(originalPassword, hash)).toBe(true);
      expect(await bcrypt.compare(originalPassword.toLowerCase(), hash)).toBe(
        false,
      );
      expect(await bcrypt.compare(originalPassword.trim(), hash)).toBe(false);
    });

    test.each([
      ["ASCII", "a".repeat(72)],
      ["multibyte", "🔑".repeat(18)],
    ])("With a 72-byte %s password", async (label, inputPassword) => {
      expect(Buffer.byteLength(inputPassword, "utf8")).toBe(72);
      const response = await createUser(`boundary_${label}`, inputPassword);
      expect(response.status).toBe(201);
      const responseBody = await response.json();
      expect(responseBody).not.toHaveProperty("password");

      const result = await prisma.user.findUnique({
        where: { id: responseBody.id },
        select: { password: true },
      });
      expect(bcrypt.getRounds(result.password)).toBe(4);
      expect(await bcrypt.compare(inputPassword, result.password)).toBe(true);
    });

    test.each([
      ["missing", undefined],
      ["null", null],
      ["empty", ""],
      ["number", 12345],
      ["boolean", true],
      ["object", {}],
      ["array", ["password"]],
      ["long_ascii", "a".repeat(73)],
      ["long_multibyte", "🔑".repeat(18) + "a"],
    ])("With an invalid %s password", async (label, inputPassword) => {
      const username = `invalid_${label}`;
      const response = await createUser(username, inputPassword);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        name: "ValidationError",
        message: "A senha deve ser uma string não vazia de até 72 bytes.",
        action: "Informe uma senha válida e tente novamente.",
        status_code: 400,
      });

      const result = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });
      expect(result).toBeNull();
    });
    test("With duplicated email", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "validuser2",
          email: "validuser@example.com",
          password: "validpassword",
        }),
      });
      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado.",
        action: "Ajuste os dados e tente novamente.",
        status_code: 400,
      });
    });

    test("With duplicated username", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "validuser",
          email: "validuser2@example.com",
          password: "validpassword",
        }),
      });
      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado.",
        action: "Ajuste os dados e tente novamente.",
        status_code: 400,
      });
    });

    test("With duplicated email in different case", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "validuser_different_case",
          email: "ValidUser@Example.com",
          password: "validpassword",
        }),
      });
      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado.",
        action: "Ajuste os dados e tente novamente.",
        status_code: 400,
      });
    });

    test("With duplicated username in different case", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "ValidUser",
          email: "validuser_different_case@example.com",
          password: "validpassword",
        }),
      });
      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado.",
        action: "Ajuste os dados e tente novamente.",
        status_code: 400,
      });
    });
  });
});

async function createUser(username, password) {
  return fetch("http://localhost:3000/api/v1/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      email: `${username}@example.com`,
      password,
    }),
  });
}
