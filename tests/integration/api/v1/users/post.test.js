import database from "infra/database.js";
import orchestrator from "tests/orchestrator.js";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatabase();
  await orchestrator.runPendingMigrations();
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
        password: "validpassword",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.created_at).toBeDefined();
      expect(responseBody.updated_at).toBeDefined();

      const parsedCreatedAt = new Date(responseBody.created_at).toISOString();
      expect(responseBody.created_at).toEqual(parsedCreatedAt);

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

      const userInDatabase = await database.query({
        text: "SELECT * FROM users WHERE id = $1;",
        values: [responseBody.id],
      });

      expect(userInDatabase.rows.length).toBe(1);
      const userRow = userInDatabase.rows[0];
      expect(userRow.id).toBe(responseBody.id);
      expect(userRow.username).toBe("validuser");
      expect(userRow.email).toBe("validuser@example.com");
      expect(userRow.password).toBe("validpassword");
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
