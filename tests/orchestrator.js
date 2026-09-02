import retry from "async-retry";
import database from "infra/database.js";

async function cleanDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function runPendingMigrations() {
  await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
}

async function waitForAllServices() {
  await waitForWebServer();

  async function waitForWebServer() {
    // Tenta acessar a rota de status repetidas vezes até o servidor estar pronto
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");

      // Se a resposta não for 200 (OK), lança erro para tentar de novo
      if (response.status !== 200) {
        throw Error();
      }
    }
  }
}

const orchestrator = {
  waitForAllServices,
  cleanDatabase,
  runPendingMigrations,
};

export default orchestrator;
