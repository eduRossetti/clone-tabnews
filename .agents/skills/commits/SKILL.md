---
name: commits
description: >-
  Use esta skill para criar, formatar, validar ou explicar commits seguindo o padrão
  Conventional Commits, Commitizen (npm run commit), Husky (.husky/commit-msg) e Commitlint no clone-tabnews.
---

# Skill: Commits Padronizados — clone-tabnews

## Visão Geral

O projeto utiliza **Conventional Commits** obrigatório, garantido em duas etapas:

1. **Localmente**: Hook do Husky em [`.husky/commit-msg`](file:///home/eduardorossetti/projetos/clone-tabnews/.husky/commit-msg) que valida a mensagem via Commitlint antes de aceitar o commit.
2. **No CI/CD**: Job `commitlint` no GitHub Actions ([`.github/workflows/linting.yaml`](file:///home/eduardorossetti/projetos/clone-tabnews/.github/workflows/linting.yaml)) que bloqueia o Merge se algum commit da PR estiver fora do padrão.

---

## Como Fazer Commits no Projeto

### Opção 1: Interativo via Commitizen (Recomendado no Terminal)

O script `"commit": "cz"` no `package.json` abre o prompt interativo:

```bash
npm run commit
```

### Opção 2: Direto via Git (Seguindo a Sintaxe Estrita)

```bash
git commit -m "type(escopo): mensagem em português do brasil"
```

> [!IMPORTANT]
> **Regra de Idiomas no Commit:**
>
> - **Tipo (`type`)**: SEMPRE em **inglês** (`feat`, `fix`, `test`, `refactor`, `style`, `chore`, `docs`, `perf`, `ci`) — obrigatório pelo `@commitlint/config-conventional`.
> - **Descrição / Mensagem**: SEMPRE em **Português do Brasil**, no imperativo, tudo em minúsculas e sem ponto final.
> - **Exemplo correto**: `git commit -m "feat(status): adiciona contagem de conexões ativas"`
> - **Exemplo incorreto**: `git commit -m "recurso(status): adiciona contagem"` ❌ (tipo em português quebra o commitlint)

---

## Estrutura do Conventional Commits

```text
tipo_em_ingles(escopo_opcional): descricao_em_portugues_no_imperativo

[corpo opcional explicando o porquê em português]

[rodapé opcional: refs #123, BREAKING CHANGE: ...]
```

### 🏷️ Tipos Permitidos (`@commitlint/config-conventional`)

| Tipo       | Quando Usar                                             | Exemplo                                                    |
| :--------- | :------------------------------------------------------ | :--------------------------------------------------------- |
| `feat`     | Nova funcionalidade para o usuário                      | `feat(api): adiciona endpoint POST /api/v1/users`          |
| `fix`      | Correção de bug                                         | `fix(database): corrige vazamento de conexao no getStatus` |
| `refactor` | Mudança de código que não corrige bug nem adiciona feat | `refactor(controller): extrai errorHandlers para infra`    |
| `test`     | Adição ou correção de testes                            | `test(status): adiciona teste para metodo POST 405`        |
| `style`    | Formatação, espaços, ponto-e-vírgula (não afeta lógica) | `style: formata arquivos com prettier`                     |
| `chore`    | Tarefas de build, configs, dependências, ferramentas    | `chore(deps): atualiza jest para v30`                      |
| `docs`     | Alterações apenas em documentação                       | `docs: atualiza instrucoes no README.md`                   |
| `perf`     | Melhoria de performance                                 | `perf(database): adiciona indice na coluna email`          |
| `ci`       | Mudanças em arquivos de CI/CD (`.github/workflows/`)    | `ci: adiciona check de commitlint no pull request`         |

---

## ⚠️ Regras Cruciais para NÃO quebrar o Commitlint

1. **Descrição em letras minúsculas**:
   - ❌ `feat: Adiciona novo model`
   - ✅ `feat: adiciona novo model`
2. **Sem ponto final no título**:
   - ❌ `fix: corrige query do postgres.`
   - ✅ `fix: corrige query do postgres`
3. **Verbo no presente/imperativo**:
   - ❌ `feat: adicionado suporte a ssl`
   - ✅ `feat: adiciona suporte a ssl`
4. **Espaço obrigatório após os dois-pontos `:`**:
   - ❌ `feat(api):rota de status`
   - ✅ `feat(api): rota de status`

---

## Como Validar Mensagens de Commit Manualmente

```bash
# Validar uma mensagem avulsa com commitlint
echo "feat: adiciona model de usuarios" | npx commitlint

# Validar os commits da branch atual em relação à main
npx commitlint --from=main --to=HEAD --verbose
```
