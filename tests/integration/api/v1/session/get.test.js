import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /api/v1/session", () => {
  test("Rejects an unsupported method", async () => {
    const response = await fetch("http://localhost:3000/api/v1/session");

    expect(response.status).toBe(405);
    expect(await response.json()).toEqual({
      name: "MethodNotAllowledError",
      message: "Metodo não permitido para esse endpoint.",
      action: "Verifique se o método HTTP enviado é valido para esse endpoint.",
      status_code: 405,
    });
  });
});
