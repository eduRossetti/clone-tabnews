# Skill Gate — Roteador de Intenção e Modos de Operação

## Propósito

Este arquivo orienta a IA a balancear **velocidade de desenvolvimento** com **entendimento técnico**.
O objetivo é avançar rapidamente nas aulas do curso, delegando implementação e código para a IA quando solicitado, mas sempre mantendo clareza sobre o que está sendo construído.

---

## ⚡ Modos de Operação

A IA opera em 2 modos automáticos com base no comando do usuário:

### 1. Modo Acelerador / Execução Direta (Default para pedidos de ação)

**Gatilhos:** _"faz isso"_, _"implementa a rota X"_, _"corrige o bug"_, _"cria a migration"_, _"refatora"_, etc.

- **Ação Imediata**: Escreva os arquivos, execute comandos, rode os testes e aplique a solução de ponta a ponta sem atrito.
- **Respeito à Arquitetura**: Siga estritamente o padrão do projeto (MVC, `models/`, `pages/api/`, `infra/`, etc.).
- **📖 Explicação Detalhada Obrigatória Pós-Execução (Para Aprendizado)**:
  Toda vez que a IA desenvolver ou alterar algo, ela **DEVE obrigatoriamente** finalizar a resposta com uma explicação detalhada e estruturada contendo:
  1. **🎯 O que foi feito e Por que**: A motivação da mudança e o problema que ela resolveu.
  2. **🏛️ Decisão de Arquitetura**: Por que o código foi colocado naquele arquivo/camada específica (Model, Controller, View ou Infra) e não em outro.
  3. **⚙️ O que acontece internamente (Fluxo)**: Como os dados trafegam pelo código novo (passo a passo do fluxo de execução).
  4. **💡 Conceito-Chave / Aprendizado**: Qual conceito de engenharia/programação ou padrão do curso foi aplicado.
  5. **🛡️ Boas Práticas e Tradeoffs**: Cuidados tomados (segurança, performance, tratamento de erros) e possíveis alternativas.

### 2. Modo Mentor / Conceitual (Para dúvidas e explicações)

**Gatilhos:** _"o que é"_, _"como funciona"_, _"por que"_, _"explica"_, _"qual a diferença"_, etc.

- Ativa a skill `aprendizado`.
- Foco em analogias, fluxo de dados, tradeoffs e raciocínio técnico sem enrolação.

---

## 🧭 Roteamento Automático de Skills

Analise as palavras-chave da mensagem e carregue a skill correspondente para guiar o contexto:

| Palavras-chave detectadas                                                               | Skill a carregar  | Contexto aplicado                                   |
| :-------------------------------------------------------------------------------------- | :---------------- | :-------------------------------------------------- |
| `docker`, `container`, `compose`, `volume`, `networking`                                | `docker`          | Infraestrutura de containers e `compose.yaml`       |
| `banco`, `postgres`, `sql`, `query`, `migration`, `migrate`, `pg`                       | `banco-de-dados`  | Conexões via `database.js`, migrations e SQL        |
| `teste`, `jest`, `unit`, `integração`, `orchestrator`, `describe`                       | `testes`          | Execução e criação de testes via Jest               |
| `api`, `rota`, `route`, `endpoint`, `handler`, `next-connect`                           | `nextjs-api`      | Rotas em `pages/api/` e `infra/controller.js`       |
| `mvc`, `model`, `view`, `controller`, `camada`, `organização`                           | `arquitetura-mvc` | Separação de responsabilidades e estrutura          |
| `erro`, `bug`, `não funciona`, `exception`, `stack trace`, `500`                        | `debugging`       | Diagnóstico de causa raiz e correção rápida         |
| `commit`, `husky`, `commitlint`, `commitizen`, `cz`, `conventional`                     | `commits`         | Padronização de mensagens de commit                 |
| `ci`, `cd`, `actions`, `pipeline`, `checks`, `pull request`, `pr`, `prettier`, `eslint` | `ci-cd`           | Garantia de aprovação nos 4 status checks do GitHub |
| `o que é`, `como funciona`, `por que`, `explica`, `diferença`                           | `aprendizado`     | Explicações conceituais didáticas                   |

---

## 🎯 Diretrizes de Execução

1. **Autonomia com Responsabilidade**: Se o usuário pediu para implementar ou corrigir algo, não hesite em editar arquivos e rodar testes de imediato.
2. **Sem Código Desconhecido**: Nunca entregue código "mágico" sem explicar em poucas linhas o que aquela alteração resolve.
3. **Foco no Próximo Passo**: Ao concluir uma tarefa, indique o que foi validado e se o projeto está pronto para a próxima aula/etapa.
