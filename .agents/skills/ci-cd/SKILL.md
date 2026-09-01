---
name: ci-cd
description: >-
  Use esta skill para gerenciar, rodar, debugar ou explicar o pipeline de CI/CD do GitHub Actions,
  garantindo que todos os status checks obrigatórios (Jest Ubuntu, Prettier, Eslint e commitlint) passem antes do merge.
---

# Skill: CI/CD & Pipeline de Validação — clone-tabnews

## Os 4 Status Checks Obrigatórios do GitHub

Todo Pull Request no repositório precisa obrigatoriamente passar por **4 verificações automáticas** no GitHub Actions antes de ser aprovado para merge:

```
┌─────────────────────────────────────────────────────────────┐
│                 GitHub Actions Status Checks                │
├───────────────────┬─────────────────────────────────────────┤
│ 1. Jest Ubuntu    │ Testes automatizados de integração      │
│ 2. Prettier       │ Formatação de código padronizada        │
│ 3. Eslint         │ Análise estática de código JS/React     │
│ 4. commitlint     │ Validação do padrão dos commits da PR   │
└───────────────────┴─────────────────────────────────────────┘
```

---

## 🛠️ Mapeamento dos Checks e Comandos Locais

Para garantir que o CI do GitHub nunca quebre, execute os comandos equivalentes localmente antes de enviar o código (`git push`):

### 1. `Jest Ubuntu`

- **Workflow**: [`.github/workflows/tests.yaml`](file:///home/eduardorossetti/projetos/clone-tabnews/.github/workflows/tests.yaml)
- **Comando Local**:
  ```bash
  npm test
  ```
- **O que valida**: Sobe o container Docker do Postgres, inicia o servidor Next.js, aplica migrations e roda todos os testes de integração do Jest em sequência (`--runInBand`).

---

### 2. `Prettier`

- **Workflow**: [`.github/workflows/linting.yaml`](file:///home/eduardorossetti/projetos/clone-tabnews/.github/workflows/linting.yaml) (Job `prettier`)
- **Comando de Checagem**:
  ```bash
  npm run lint:prettier:check
  ```
- **Comando de Auto-Correção**:
  ```bash
  npm run lint:prettier:fix
  ```
- **O que valida**: Garante que indentação, aspas, quebras de linha e ponto-e-vírgula estejam perfeitamente formatados.

---

### 3. `Eslint`

- **Workflow**: [`.github/workflows/linting.yaml`](file:///home/eduardorossetti/projetos/clone-tabnews/.github/workflows/linting.yaml) (Job `eslint`)
- **Comando de Checagem**:
  ```bash
  npm run lint:eslint:check
  ```
- **O que valida**: Regras do ESLint Flat Config (`eslint.config.mjs`), variáveis não utilizadas, hooks do React e boas práticas do Next.js.

---

### 4. `commitlint`

- **Workflow**: [`.github/workflows/linting.yaml`](file:///home/eduardorossetti/projetos/clone-tabnews/.github/workflows/linting.yaml) (Job `commitlint`)
- **Comando de Checagem Local**:
  ```bash
  npx commitlint --from=main --to=HEAD --verbose
  ```
- **O que valida**: Todos os commits pertencentes à branch da PR devem seguir a convenção Conventional Commits (ex: `feat:`, `fix:`, `test:`, etc.).

---

## 🚀 Checklist Pré-Push (Rode Tudo de Uma Vez)

Antes de abrir Pull Request ou dar push na branch, execute a sequência de checagem completa:

```bash
# 1. Auto-formata código
npm run lint:prettier:fix

# 2. Valida ESLint
npm run lint:eslint:check

# 3. Roda todos os testes
npm test

# 4. Cria commit padronizado
npm run commit
```

---

## 🔍 Como Diagnosticar Falhas no CI/CD

| Check com Falha    | Causa Provável                                              | Ação Rápida de Correção                                                   |
| :----------------- | :---------------------------------------------------------- | :------------------------------------------------------------------------ |
| ❌ **Jest Ubuntu** | Teste quebrou, erro 500 na rota ou timeout                  | Rodar `npm test` localmente e inspecionar a rota ou Model com falha       |
| ❌ **Prettier**    | Arquivo salvo sem formatação do editor                      | Rodar `npm run lint:prettier:fix`, commitar e dar push                    |
| ❌ **Eslint**      | Variável declarada e não usada, regra do React violada      | Rodar `npm run lint:eslint:check`, corrigir os avisos no código           |
| ❌ **commitlint**  | Mensagem de commit começou com maiúscula ou tem ponto final | Fazer rebase/amend no commit: `git commit --amend -m "tipo: msg correta"` |
