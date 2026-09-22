import orchestrator from "tests/orchestrator.js";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.cleanDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("Retrieving an existing user", async () => {
      // First create a user
      const createResponse = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "testuser",
          email: "testuser@example.com",
          password: "validpassword",
        }),
      });
      const createdUser = await createResponse.json();

      // Now query the user
      const response = await fetch(
        "http://localhost:3000/api/v1/users/testuser",
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "testuser",
        email: "testuser@example.com",
        created_at: createdUser.created_at,
        updated_at: createdUser.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.password).toBeUndefined();
    });

    test("Retrieving a non-existent user", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/donotexist",
      );
      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: 'O usuário "donotexist" não foi encontrado.',
        action: "Verifique se o nome de usuário está digitado corretamente.",
        status_code: 404,
      });
    });
  });
});
