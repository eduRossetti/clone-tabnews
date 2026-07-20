import useSWR from "swr";

async function fetchStatus(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  const { data, error, isLoading } = useSWR("/api/v1/status", fetchStatus, {
    refreshInterval: 2000,
  });

  if (error) {
    return <h1>Erro ao carregar os dados de status.</h1>;
  }

  if (isLoading) {
    return <h1>Carregando...</h1>;
  }

  const updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");

  return (
    <>
      <h1>Status</h1>
      <div>Ultima atualização: {updatedAtText}</div>
      <br />
      <DatabaseStatus database={data.dependencies.database} />
    </>
  );
}

function DatabaseStatus({ database }) {
  const { version, max_connections, used_connections } = database;

  return (
    <div>
      <h2>Banco de Dados</h2>
      <span>Versão do Postgres: {version}</span> <br />
      <span>Conexões usadas: {used_connections}</span> <br />
      <span>Máximo de conexões: {max_connections}</span>
    </div>
  );
}
