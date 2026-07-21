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
      <DatabaseStatus />
    </>
  );
}

function DatabaseStatus() {
  const { isLoading, data, error } = useSWR("/api/v1/status", fetchStatus, {
    refreshInterval: 2000,
  });

  if (error) return <div>Erro ao carregar informações!</div>;

  let updatedAtText = "Carregando...";
  let maxConnectionsText = "Carregando";
  let usedConnectionsText = "Carregando";
  let versionText = "Carregando";

  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");
    maxConnectionsText = data.dependencies.database.max_connections;
    usedConnectionsText = data.dependencies.database.used_connections;
    versionText = data.dependencies.database.version;
  }

  return (
    <div>
      <span>Ultima atualização: {updatedAtText}</span> <br />
      <span>Versão do Postgres: {versionText}</span> <br />
      <span>Conexões usadas: {usedConnectionsText}</span> <br />
      <span>Maximo de conexões: {maxConnectionsText}</span>
    </div>
  );
}
