import useSWR from "swr";

async function fetchStatus(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  const response = useSWR("/api/v1/status", fetchStatus, {
    refreshInterval: 2000,
  });

  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <DatabaseStatus />
    </>
  );
}

function UpdatedAt() {
  const { isLoading, data, error } = useSWR("/api/v1/status", fetchStatus, {
    refreshInterval: 2000,
  });

  let updatedAt = "Carregando...";

  if (error) return <div>Erro ao carregar informações!</div>;

  if (!isLoading && data) {
    updatedAt = new Date(data.updated_at).toLocaleString("pt-BR");
  }

  return (
    <div>
      <span>Ultima Atualização: {updatedAt}</span>
    </div>
  );
}

function DatabaseStatus() {
  const { isLoading, data, error } = useSWR("/api/v1/status", fetchStatus, {
    refreshInterval: 2000,
  });

  if (error) return <div>Erro ao carregar informações do database!</div>;

  let maxConnectionsText = "Carregando";
  let usedConnectionsText = "Carregando";
  let versionText = "Carregando";

  if (!isLoading && data) {
    maxConnectionsText = data.dependencies.database.max_connections;
    usedConnectionsText = data.dependencies.database.used_connections;
    versionText = data.dependencies.database.version;
  }

  return (
    <div>
      <h2>Database:</h2>
      <span>Versão do Postgres: {versionText}</span> <br />
      <span>Conexões usadas: {usedConnectionsText}</span> <br />
      <span>Maximo de conexões: {maxConnectionsText}</span>
    </div>
  );
}
