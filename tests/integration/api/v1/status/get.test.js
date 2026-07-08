import orchestrator from "tests/orchestrator.js"

beforeAll(async () => {
  await orchestrator.waitForAllServices();
})

test("GET to /api/v1/status shoud return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  

  const responseBody = await response.json();
  expect(responseBody.updated_at).toBeDefined();

  const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
  expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

  expect(responseBody.dependencies).toBeDefined();
  expect(typeof responseBody.dependencies).toBe("object");

  const version = responseBody.dependencies.database.version;
  expect(version).toBeDefined();
  expect(typeof version).toBe("string");
  expect(Number.isNaN(parseFloat(version))).toBe(false);
  expect(version).toBe("16.0");

  const maxConnections = responseBody.dependencies.database.max_connections;
  expect(maxConnections).toBeDefined();
  expect(typeof maxConnections).toBe("number");
  expect(Number.isNaN(maxConnections)).toBe(false);
  expect(maxConnections).toBe(100);

  const usedConnections = responseBody.dependencies.database.used_connections;
  expect(usedConnections).toBeDefined();
  expect(typeof usedConnections).toBe("number");
  expect(Number.isNaN(usedConnections)).toBe(false);
  expect(usedConnections).toEqual(1);
});
