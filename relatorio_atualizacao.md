# Relatório: Atualização de Dependências e Resolução de Breaking Changes

Este documento registra todas as alterações arquiteturais e correções feitas no projeto para acomodar a atualização de dependências para suas versões principais (*Major*) mais recentes, mantendo a estabilidade e a compatibilidade com o curso.

## 1. Visão Geral das Atualizações

Todas as dependências foram forçadas a atualizar ignorando o *SemVer* original (via `npm-check-updates -u`), saltando múltiplas versões estruturais:
- **`next`**: `13.x` ➔ `16.x`
- **`react`** / **`react-dom`**: `18.x` ➔ `19.x`
- **`eslint`**: `8.x` ➔ `9.x` (Mantido na 9.x em vez da 10.x para preservar compatibilidade com plugins React)
- **`node-pg-migrate`**: `6.x` ➔ `8.x`
- **`pg`**: `8.x` ➔ `8.22.0`
- **`jest`**: `29.x` ➔ `30.x`

Devido a saltos de versão Major (como ir da versão 13 para a 16), ocorreram **Breaking Changes** (quebras de compatibilidade). Abaixo estão os detalhes de cada uma e como foram resolvidas.

---

## 2. Breaking Changes e Soluções

### 2.1. Remoção do CLI de Linting do Next.js
> [!WARNING]
> **Problema:** A partir do Next.js 16, o comando embutido `next lint` foi depreciado e removido do CLI principal da Vercel. O script antigo `"lint:eslint:check": "next lint --dir ."` parou de funcionar com o erro `unknown option '--dir'`.

**A Solução:**
- Alterado o script no arquivo [package.json](file:///workspaces/clone-tabnews/package.json).
- Trocado de `"next lint --dir ."` para utilizar a CLI nativa do ESLint: `"eslint ."`.
- **Impacto para você:** Nenhum. Você continua executando `npm run lint:eslint:check` normalmente no terminal.

### 2.2. Adoção Obrigatória do ESLint Flat Config
> [!IMPORTANT]
> **Problema:** O ESLint na versão 9+ mudou radicalmente sua arquitetura. O arquivo de configuração clássico (`.eslintrc.json`) não é mais suportado por padrão. O ESLint agora exige o uso do **Flat Config** através do arquivo `eslint.config.mjs`, que utiliza a sintaxe de Módulos ES (import/export).

**A Solução:**
- O arquivo `.eslintrc.json` foi deletado do projeto.
- Um novo arquivo [eslint.config.mjs](file:///workspaces/clone-tabnews/eslint.config.mjs) foi construído no padrão Flat Config.
- A configuração atual extrai regras nativas do `eslint-config-next`, juntamente com os plugins de integração com `jest` e `prettier` utilizando arrays estáticos exportados.
- Optou-se por fixar a versão do ESLint no `package.json` em `^9.14.0` porque a recém-lançada versão `10.x` alterou drasticamente o *ScopeManager* e a Árvore Sintática Abstrata (AST), o que estava causando erro crítico na compilação do plugin do React.

### 2.3. Alteração de Exports no Node-PG-Migrate (Erro 500)
> [!CAUTION]
> **Problema:** Ao rodar os testes após o upgrade, a rota de banco de dados começou a devolver `500 Internal Server Error`. A causa raiz: a versão 8 da biblioteca `node-pg-migrate` aboliu a "exportação padrão" (Default Export) para se alinhar completamente ao padrão de módulos Javascript modernos. A variável `migrationRunner` retornava "not a function".

**A Solução:**
- O código da API em [pages/api/v1/migrations/index.js](file:///workspaces/clone-tabnews/pages/api/v1/migrations/index.js) foi atualizado para utilizar *Named Imports* (Importação Nomeada).
- **Código Anterior:**
  ```javascript
  import migrationRunner from "node-pg-migrate";
  ```
- **Novo Código:**
  ```javascript
  import { runner as migrationRunner } from "node-pg-migrate";
  ```

---

## 3. Resumo dos Scripts Restabelecidos

Todos os fluxos vitais definidos pelo professor foram testados e mantêm sua assinatura original no terminal:

- **`npm run dev`**: Sobe o ecossistema (banco via docker, migrações na inicialização, e Next.js em dev).
- **`npm run test`**: Roda testes em paralelo sem afetar a produção, validando se as lógicas e banco persistem sem problemas.
- **`npm run lint:eslint:check`**: Atinge todos os arquivos `.js` via ESLint 9 Flat Config.
- **`npm run lint:prettier:check`** / **`fix`**: Mantém a formatação com o Prettier inalterada.

## 4. Dicas de Debugging para o Futuro

Caso futuramente você enfrente algum erro crítico parecido em um projeto real:
1. **Verifique os Logs Ocultos:** Testes (como os do Jest rodando no curso) frequentemente ocultam erros de servidor no console por causa da *flag* `--hide next`. Temporariamente apague o `--hide next` no [package.json](file:///workspaces/clone-tabnews/package.json) e rode o teste; a tela vai cuspir qual linha exata quebrou no servidor.
2. **Leia os Releases:** Falhas que retornam `not a function` após uma atualização de biblioteca indicam fortes quebras de arquitetura do mantenedor. Verifique imediatamente a página de *Releases* do repositório correspondente no GitHub.

---

## 5. Atualização para ESLint 10.x e Quebra de CI

> [!CAUTION]
> **Aviso de Quebra Crítica (Breaking Change Indesejada):** A pedido, forçamos a atualização da dependência do ESLint para a versão `10.7.0` (a mais recente). No entanto, conforme previsto nas regras de arquitetura do projeto, isso quebra o fluxo de CI atual.

**O Problema (Erro Fatal):**
Ao executar `npm run lint:eslint:check` com a versão 10, o Node.js cospe o erro:
`TypeError: scopeManager.addGlobals is not a function`

**Explicação Técnica Profunda:**
A arquitetura do ESLint foi severamente alterada na versão 10. A API interna de manipulação de escopos (ScopeManager), que é ativamente utilizada por plugins do ecossistema React (especificamente os encapsulados pelo `eslint-config-next`), teve seus métodos depreciados e removidos.
Como os desenvolvedores da Vercel (Next.js) e do React mantêm a integração estável apenas até a versão `9.x` (como consta nas `peerDependencies`), injetar a versão 10 resulta em um colapso arquitetural onde os plugins tentam chamar funções nativas que não existem mais no núcleo do ESLint.

**O que fazer a seguir?**
Você tem duas opções profissionais:
1. Manter a versão `10.x` instalada e não rodar o linter (quebrando o CI temporariamente) até que a Vercel atualize o pacote `eslint-config-next`.
2. Fazer um *rollback* no `package.json` voltando o `"eslint"` para `^9.14.0`, o que vai restaurar a funcionalidade completa da esteira de CI instantaneamente.
