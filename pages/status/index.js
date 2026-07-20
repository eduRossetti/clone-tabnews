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

  if (response.isLoading === true) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <h1>Status</h1>
      <DatabaseStatus />
    </>
  );
}

function DatabaseStatus() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchStatus, {
    refreshInterval: 2000,
  });

  let updatedAtText = "Carregando...";
  let maxConnectionsText,
    usedConnectionsText,
    versionText = "Carregando";

  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");
    maxConnectionsText = data.dependencies.database.max_connections;
    usedConnectionsText = data.dependencies.database.used_connections;
    versionText = data.dependencies.database.version;
  }

  return (
  <div>
    <span>Ultima atualização: {updatedAtText}</span> <br/>
    <span>Versão do Postgres: {versionText}</span> <br/>
    <span>Conexões usadas: {usedConnectionsText}</span> <br/>
    <span>Maximo de conexões: {maxConnectionsText}</span>
  </div>
  );
}
