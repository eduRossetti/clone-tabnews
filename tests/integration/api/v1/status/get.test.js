test("GET to /api/v1/status shoud return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");
  expect(response.status).toBe(200);

  const responseBody = await response.json();
  expect(responseBody.updated_at).toBeDefined();

  const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
  expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

  const dbVersion = responseBody.database.db_version;
  expect(dbVersion).toBeDefined();
  expect(typeof dbVersion).toBe("string");
  expect(Number.isNaN(parseFloat(dbVersion))).toBe(false);

  const maxConnections = responseBody.database.max_connections;
  expect(maxConnections).toBeDefined();
  expect(typeof maxConnections).toBe("number");
  expect(Number.isNaN(parseFloat(maxConnections))).toBe(false);

  const usedConnections = responseBody.database.used_connections;
  expect(usedConnections).toBeDefined();
  expect(typeof usedConnections).toBe("number");
  expect(Number.isNaN(parseFloat(usedConnections))).toBe(false);

  console.log(responseBody.database);
});
