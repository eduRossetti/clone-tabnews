import database from "infra/database.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

beforeEach(async () => {
  await orchestrator.cleanDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("Renaming and retrieving a user while preserving other data", async () => {
      const original = await createUser("original");
      const response = await patchUser("OrIgInAl", { username: "NewName" });
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain(
        "application/json",
      );
      const body = await response.json();
      const updated = await findById(original.id);
      expect(body).toEqual({
        id: original.id,
        username: "newname",
        email: original.email,
        created_at: original.created_at.toISOString(),
        updated_at: updated.updated_at.toISOString(),
      });
      expect(updated).toEqual({
        ...original,
        username: "newname",
        updated_at: updated.updated_at,
      });
      expect(updated.updated_at.getTime()).toBeGreaterThan(
        original.updated_at.getTime(),
      );
      const found = await fetch("http://localhost:3000/api/v1/users/newname");
      expect(found.status).toBe(200);
      expect(await found.json()).toEqual(body);
      const missing = await fetch(
        "http://localhost:3000/api/v1/users/original",
      );
      expect(missing.status).toBe(404);
    });

    test.each(["original", "OrIgInAl"])(
      "Accepting the user's own username: %s",
      async (username) => {
        const original = await createUser("original");
        const response = await patchUser("original", { username });
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.username).toBe("original");
        expect(body).not.toHaveProperty("password");
        const updated = await findById(original.id);
        expect(updated).toEqual({
          ...original,
          updated_at: updated.updated_at,
        });
        expect(updated.updated_at.getTime()).toBeGreaterThan(
          original.updated_at.getTime(),
        );
      },
    );

    test.each(["occupied", "OcCuPiEd"])(
      "Rejecting an occupied username: %s",
      async (username) => {
        const original = await createUser("original");
        const occupied = await createUser("occupied");
        const response = await patchUser("original", { username });
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual(duplicateError);
        expect(await findById(original.id)).toEqual(original);
        expect(await findById(occupied.id)).toEqual(occupied);
      },
    );

    test("Rejecting a nonexistent user", async () => {
      const response = await patchUser("missing", { username: "newname" });
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        name: "NotFoundError",
        message: 'O usuário "missing" não foi encontrado.',
        action: "Verifique se o nome de usuário está digitado corretamente.",
        status_code: 404,
      });
    });

    test.each([undefined, null, 123, true, {}, [], "", "   ", "a".repeat(31)])(
      "Rejecting invalid username: %p",
      async (username) => {
        const original = await createUser("original");
        const response = await patchUser("original", { username });
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
          name: "ValidationError",
          message:
            "O username deve ser uma string não vazia de até 30 caracteres.",
          action: "Informe um username válido e tente novamente.",
          status_code: 400,
        });
        expect(await findById(original.id)).toEqual(original);
      },
    );

    test("Ignoring additional fields and accepting 30 characters", async () => {
      const original = await createUser("original");
      const username = "a".repeat(30);
      const response = await patchUser("original", {
        username,
        id: "invalid",
        email: "changed@example.com",
        password: "changed",
        created_at: "2000-01-01",
        updated_at: "2000-01-01",
      });
      expect(response.status).toBe(200);
      expect(await response.json()).not.toHaveProperty("password");
      const updated = await findById(original.id);
      expect(updated).toEqual({
        ...original,
        username,
        updated_at: updated.updated_at,
      });
    });

    test("Allowing only one concurrent rename to the same username", async () => {
      const originals = await Promise.all([
        createUser("first"),
        createUser("second"),
      ]);
      const responses = await Promise.all([
        patchUser("first", { username: "shared" }),
        patchUser("second", { username: "ShArEd" }),
      ]);
      expect(responses.map((response) => response.status).sort()).toEqual([
        200, 400,
      ]);
      const winnerIndex = responses.findIndex(
        (response) => response.status === 200,
      );
      const loserIndex = responses.findIndex(
        (response) => response.status === 400,
      );
      const winnerBody = await responses[winnerIndex].json();
      expect(winnerBody.username).toBe("shared");
      expect(winnerBody).not.toHaveProperty("password");
      const updated = await findById(originals[winnerIndex].id);
      expect(updated).toEqual({
        ...originals[winnerIndex],
        username: "shared",
        updated_at: updated.updated_at,
      });
      expect(await responses[loserIndex].json()).toEqual(duplicateError);
      expect(await findById(originals[loserIndex].id)).toEqual(
        originals[loserIndex],
      );
    });
  });
});

const duplicateError = {
  name: "ValidationError",
  message: "O username informado já está sendo utilizado.",
  action: "Ajuste os dados e tente novamente.",
  status_code: 400,
};

async function patchUser(username, body) {
  return fetch(`http://localhost:3000/api/v1/users/${username}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function createUser(username) {
  const response = await fetch("http://localhost:3000/api/v1/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      email: `${username}@example.com`,
      password: "validpassword",
    }),
  });
  expect(response.status).toBe(201);
  return findById((await response.json()).id);
}

async function findById(id) {
  const result = await database.query({
    text: "SELECT * FROM users WHERE id = $1;",
    values: [id],
  });
  return result.rows[0];
}
