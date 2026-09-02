---
name: debugging
description: >-
  Use esta skill para diagnosticar, explicar ou corrigir bugs, erros de execução,
  falhas de banco/docker, exceções não tratadas ou stack traces no clone-tabnews.
---

# Skill: Debugging — clone-tabnews

## Diretrizes de Resolução de Erros

1. **Ação Rápida**: Se o usuário pedir para consertar, identifique a causa raiz e aplique o fix diretamente no código ou ambiente.
2. **Clareza de Causa Raiz**: Explique em poucas linhas por que o erro aconteceu e qual raciocínio levou à solução.
3. **Validação**: Rode o teste ou comando de validação para comprovar que o problema foi resolvido.

---

## Mapa de Erros Comuns do Projeto

### 🔴 Erros de Conexão com Banco

**Sintoma**: `ECONNREFUSED 127.0.0.1:5432`

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Causa**: O container do PostgreSQL não está rodando.
**Diagnóstico**:

```bash
docker ps  # Ver se o container "postgres-dev" aparece
```

**Solução**: `npm run services:up`

---

**Sintoma**: `password authentication failed for user "local_user"`
**Causa**: Variáveis de ambiente incorretas ou `.env.development` ausente.
**Diagnóstico**:

```bash
cat .env.development  # Ver se o arquivo existe e está correto
```

---

**Sintoma**: `relation "tabela" does not exist`
**Causa**: Migration não foi aplicada.
**Solução**: `npm run migrations:up`

---

### 🟡 Erros da Aplicação Next.js

**Sintoma**: `Module not found: Can't resolve 'infra/controller'`
**Causa**: O `jsconfig.json` configura aliases de módulo. Se o arquivo não existe
ou o caminho está errado, o import falha.
**Diagnóstico**: Verificar `jsconfig.json` na raiz do projeto.

---

**Sintoma**: `405 Method Not Allowed` na API
**Causa**: Você chamou um método HTTP (ex: POST) que não tem handler registrado no `next-connect`.
**Diagnóstico**: Olhar o arquivo `pages/api/v1/[rota]/index.js` e verificar quais métodos estão registrados (`router.get`, `router.post`, etc.).

---

**Sintoma**: `500 Internal Server Error` na API
**Causa**: Exceção lançada em algum ponto da cadeia (Model, banco, etc.).
**Diagnóstico**:

1. Olhar o terminal onde o `npm run dev` está rodando — o `console.error` do `onErrorHandler` exibe o erro completo.
2. Verificar `error.cause` para encontrar o erro original encadeado.

---

### 🔵 Erros de Teste (Jest)

**Sintoma**: `Timeout - Async callback was not invoked within timeout`
**Causa**: O servidor Next.js ou o banco não responderam a tempo.
**Diagnóstico**:

```bash
docker ps  # Banco rodando?
# Em outro terminal:
curl http://localhost:3000/api/v1/status  # Next.js respondendo?
```

---

**Sintoma**: Teste passa isolado, falha em conjunto
**Causa**: Estado do banco contaminado entre testes.
**Solução**: Usar `await orchestrator.cleanDatabase()` no `beforeEach`.

---

## 🧱 Padrão de Erros Customizados (`infra/errors.js`)

A fonte da verdade para erros é [`infra/errors.js`](file:///home/eduardorossetti/projetos/clone-tabnews/infra/errors.js).

### Regras do Contrato de Erros:

1. **Estrutura Obrigatória**: Toda classe de erro customizada deve estender `Error` e implementar:
   - `name`: Nome da classe (ex: `ValidationError`, `ServiceError`).
   - `message`: Mensagem amigável explicando o que falhou.
   - `action`: Mensagem acionável orientando quem consumiu a API a corrigir a chamada.
   - `statusCode`: Código HTTP correspondente (4xx para cliente, 5xx para servidor).
   - `toJSON()`: Método serializador retornando `{ name, message, action, statusCode }`.
   - `cause`: Aceitar no construtor para preservar o erro original encadeado (`super(message, { cause })`).

2. **Fluxo no Controller (`infra/controller.js`)**:
   - Erros não tratados caem no `onErrorHandler`, que loga o erro completo e encapsula a falha real em `error.cause`.
   - **Ao debugar erros 500 no terminal, verifique sempre `error.cause`** para encontrar o ponto exato da falha.

3. **Para usar ou criar novos erros**:
   - Sempre consulte [`infra/errors.js`](file:///home/eduardorossetti/projetos/clone-tabnews/infra/errors.js) antes de instanciar ou criar uma nova classe de erro para manter a consistência do sistema.

---

## Como Ler um Stack Trace do Node.js

Dado este stack trace de exemplo:

```
ServiceError: Erro na conexão com Banco ou na Query.
    at query (infra/database.js:12:23)
    at getStatus (models/status.js:8:34)
    at getHandler (pages/api/v1/status/index.js:12:32)
```

**Como ler de baixo para cima**:

1. `pages/api/v1/status/index.js:12` — onde a requisição entrou
2. `models/status.js:8` — o Model foi chamado e algo falhou
3. `infra/database.js:12` — **aqui** o erro foi gerado (linha do `throw`)

> O erro real sempre está no **frame mais alto** (primeiro da lista, após a mensagem).
> Os frames abaixo são a pilha de chamadas que levou até lá.

---

## Raciocínio de Debugging (Passo a Passo)

1. **Leia a mensagem do erro** — é descritiva? Qual classe de erro é?
2. **Leia o stack trace** — de baixo para cima, identifique o frame mais relevante do projeto
3. **Abra o arquivo indicado** na linha indicada
4. **Entenda o contexto** — o que esse código faz? O que poderia falhar?
5. **Adicione um `console.log`** temporário para inspecionar o estado no ponto de falha
6. **Isole o problema** — o erro é de ambiente (banco, Docker)? De lógica? De configuração?
7. **Aplique a correção e verifique** — rode o teste ou a rota novamente

---

## Ferramentas de Diagnóstico

```bash
# Ver logs do banco de dados em tempo real
docker logs postgres-dev -f

# Testar uma rota da API diretamente
curl http://localhost:3000/api/v1/status | json_pp

# Ver se o Next.js está rodando
curl -I http://localhost:3000

# Ver variáveis de ambiente carregadas (cuidado: não expor em produção)
node -e "require('dotenv').config({path: '.env.development'}); console.log(process.env.POSTGRES_HOST)"
```
