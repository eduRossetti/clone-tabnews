import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("DELETE /api/v1/migrations", () => {
  test("Anonymous user", async () => {
    const response = await fetch("http://localhost:3000/api/v1/migrations", {
      method: "DELETE",
    });

    expect(response.status).toBe(405);
  });
});
