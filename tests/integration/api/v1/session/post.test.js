import { createHash } from "node:crypto";
import prisma from "infra/prisma.js";
import orchestrator from "tests/orchestrator.js";
import { parseSetCookie } from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

beforeEach(async () => {
  await orchestrator.cleanDatabase();
});

describe("POST /api/v1/session", () => {
  test("Authenticates by email and returns a persisted session and cookie", async () => {
    const registeredUser = await registerUser();
    const response = await createSession({
      email: "USER@EXAMPLE.COM",
      password: "validpassword",
    });

    expect(response.status).toBe(201);
    expect(response.headers.get("content-type")).toContain("application/json");

    const body = await response.json();
    expect(body).toEqual({
      token: expect.stringMatching(/^[a-f0-9]{64}$/),
      expires_at: expect.any(String),
    });
    expect(body).not.toHaveProperty("password");

    const expiresAt = new Date(body.expires_at);
    const thirtyDaysInMilliseconds = 30 * 24 * 60 * 60 * 1000;
    expect(expiresAt.getTime() - Date.now()).toBeGreaterThan(
      thirtyDaysInMilliseconds - 60_000,
    );
    expect(expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(
      thirtyDaysInMilliseconds,
    );

    const sessions = await prisma.session.findMany();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].user_id).toBe(registeredUser.id);
    expect(sessions[0].token_hash).toBe(
      createHash("sha256").update(body.token).digest("hex"),
    );
    expect(sessions[0].expires_at.toISOString()).toBe(body.expires_at);

    const cookies = parseSetCookie(response.headers.get("set-cookie"));
    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toMatchObject({
      name: "session",
      value: body.token,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 30 * 24 * 60 * 60,
    });
    expect(
      Math.abs(cookies[0].expires.getTime() - expiresAt.getTime()),
    ).toBeLessThan(1000);
  });

  test("Creates independent sessions for repeated logins", async () => {
    await registerUser();
    const first = await createSession({
      email: "user@example.com",
      password: "validpassword",
    });
    const second = await createSession({
      email: "user@example.com",
      password: "validpassword",
    });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect((await first.json()).token).not.toBe((await second.json()).token);
    expect(await prisma.session.count()).toBe(2);
  });

  test.each([
    ["wrong password", "user@example.com", "wrongpassword"],
    ["unknown email", "missing@example.com", "validpassword"],
  ])(
    "Rejects %s without revealing the account",
    async (label, email, password) => {
      await registerUser();
      const response = await createSession({ email, password });

      expect(response.status).toBe(401);
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(await response.json()).toEqual({
        name: "UnauthorizedError",
        message: "Email ou senha inválidos.",
        action: "Verifique suas credenciais e tente novamente.",
        status_code: 401,
      });
      expect(await prisma.session.count()).toBe(0);
    },
  );

  test.each([
    ["missing email", undefined, "validpassword"],
    ["empty email", "", "validpassword"],
    ["non-string email", 123, "validpassword"],
    ["missing password", "user@example.com", undefined],
    ["empty password", "user@example.com", ""],
    ["non-string password", "user@example.com", 123],
  ])(
    "Rejects %s without creating a session",
    async (label, email, password) => {
      await registerUser();
      const response = await createSession({ email, password });

      expect(response.status).toBe(400);
      expect(response.headers.get("set-cookie")).toBeNull();
      expect((await response.json()).name).toBe("ValidationError");
      expect(await prisma.session.count()).toBe(0);
    },
  );
});

async function registerUser() {
  const response = await fetch("http://localhost:3000/api/v1/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "user",
      email: "user@example.com",
      password: "validpassword",
    }),
  });
  expect(response.status).toBe(201);
  return response.json();
}

async function createSession(body) {
  return fetch("http://localhost:3000/api/v1/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
