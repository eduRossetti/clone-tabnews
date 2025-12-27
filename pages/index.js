import styles from "./index.module.css";

function Home() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.titulo}>Nem tudo na vida é simples.</h1>
      </header>

      <section className={styles.containerTxt}>
        <p className={styles.texto}>
          Este site está em <strong>desenvolvimento</strong> e tem como objetivo
          criar um espaço para discutir{" "}
          <strong>dilemas morais do cotidiano</strong> — aquelas decisões
          difíceis que <i>não têm resposta óbvia</i>.
        </p>

        <p className={styles.texto}>
          Aqui, a ideia não é <strong>convencer</strong>, mas{" "}
          <strong>argumentar, ouvir e refletir</strong>. As discussões serão
          avaliadas pelos proprios usuarios com um <i>sistema de pontos</i>, pela{" "}
          <span className={styles.destaque}>
            <strong>clareza e qualidade dos argumentos</strong>
          </span>
          , <strong>não pela popularidade das opiniões</strong>.
        </p>
      </section>

      <div className={styles.spacer} />

      <section className={styles.status} aria-label="Status do site">
        <p className={styles.texto}>
          🚧 <strong><i>Status</i></strong>: em construção
        </p>
      </section>
    </main>
  );
}

export default Home;
