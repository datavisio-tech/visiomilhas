# VisioMilhas - MVP1

Projeto: VisioMilhas
Empresa: DataVisio

Descrição resumida:
Plataforma SaaS para gestão de milhas/pontos de fidelidade com multi-tenant por organização.

Stack:

- Frontend: Next.js (App Router)
- Language: TypeScript
- UI: Tailwind CSS
- ORM: Drizzle ORM (Postgres)

Arquitetura de banco:

- ADM database: controle_adm_saas_datavisio
- APP database: visiomilhas_app
- Observação: usam-se duas databases separadas (ADM / APP) — não consolidar em um único DB com schemas.

Versão operacional atual: 1.3.21

Nota: integração atômica da compra ao motor FIFO implementada localmente em 1.3.20 (feature flag, não ativada por padrão). Testes unitários da compra com flag e rollback simulado adicionados em 1.3.21. Validar migration em staging antes de ativar a flag em ambientes de produção.

Status do MVP1:

- Técnico / base: 81%–85%
- Utilizável por usuário: 60%–68%

Comandos principais:

```
npm run dev
npm run build
npm run test
npm run lint
npm run typecheck
npm run db:check-env
npm run db:check-connections
npm run db:seed (exige autorização explícita)
npm run db:validate:staging:purchase-fifo (read-only; usar após QA manual em staging)

Nota sobre skills locais:

- O repositório pode conter skills locais em `.claude/skills` usadas para auxílio (code-review, frontend-patterns, security-review, test, saas-multi-tenant). Essas skills são ferramentas de apoio: regras operacionais e decisões finais residem no agente residente (`.github/agents/visiomilhas.agent.md`) e na documentação em `docs/ai-context`.
```

Status das validações (local):

- `npm run test`: OK (14 testes unitários do domínio)
- `npm run typecheck`: OK
- `npm run lint`: OK
- `npm run build`: OK

Próximos passos (curto prazo):

Planejamento 1.3.22:

- Preparar staging/DB isolado e validar `db/app/migrations/0001_add_mile_point_lots.sql` usando o runbook em `docs/ai-context/STAGING_MIGRATION_RUNBOOK.md`.
- Não aplicar migration sem autorização explícita.

Nota operacional (2026-05-20):

- As bases `DATABASE_STAGING` e `DATABASE_TEST` foram criadas e estão disponíveis; use `STAGING_DATABASE_URL` e `TEST_DATABASE_URL` explicitamente para preflights e validações. Não usar `DATABASE_URL` como fallback quando houver risco de ambiguidade.
- O QA manual de compra FIFO em staging usa `USE_FIFO_MOVEMENTS_ENGINE=1` apenas em staging e o validador read-only `npm run db:validate:staging:purchase-fifo` com identificadores seguros da compra/conta.

Notas da versão 1.3.21:

- Testes unitários da compra com flag e rollback simulado adicionados em 1.3.21. Validar migration em staging antes de ativar a flag em ambientes de produção.
- Conectar compras/vendas/transferências e CRUDs (1.2.5+)
- Implementar autenticação e deploy

Preparação 1.3.15:

- Objetivo: alinhar `db/app/schema.ts` com a migration proposta (`0001_add_mile_point_lots.sql`) e preparar o contrato `MovementsRepo` para implementação Drizzle (transações). Não aplicar migration nesta etapa.

Implementação 1.3.16:

- Implementado `MovementsRepo` concreto com Drizzle em `lib/repositories/movements.drizzle-repo.ts`. O serviço de domínio (`lib/services/movements.ts`) permanece desacoplado e recebe o repo por injeção. Não aplicar migrations nem executar seeds como parte desta etapa.

Passos iniciais para rodar local:

1. Preencher `.env.local` com as variáveis em `.env.example` (NÃO commitar `.env.local`).
2. Rodar `npm ci`.
3. `npm run dev`.

Observações de segurança:

- Não versionar `.env`.
- Não expor `APP_DATABASE_URL` / `ADM_DATABASE_URL` em logs.

Referência de ambiente e deploy:

- Veja `docs/ai-context/ENVIRONMENT.md` para a convenção de variáveis e placeholders.
- Veja `docs/ai-context/PRODUCTION_DEPLOY_RUNBOOK.md` para o fluxo de `.env.production`, deploy remoto e validação do workflow manual `workflow_dispatch`.
- A produção inicial deve manter `USE_FIFO_MOVEMENTS_ENGINE=0` até validação explícita.
- Os artefatos de produção Swarm estão em `Dockerfile`, `.dockerignore` e `stack.visiomilhas.yml`.

Notas da versão 1.3.12 (preparação do schema para ledger/FIFO):

- Ação 1.3.12: adicionado `mile_point_lots` ao schema Drizzle (arquivo `db/app/schema.ts`) e migration proposta em `db/app/migrations/0001_add_mile_point_lots.sql`.
- Observação: a migration proposta NÃO foi aplicada — apenas commitada para revisão.
- Próximo passo: 1.3.13 — implementar motor FIFO e serviços transacionais (`lib/services/movements.ts`).
- Ação 1.3.12: adicionado `mile_point_lots` ao schema Drizzle e migration proposta criada.
- Ação 1.3.13: migration refinada com FKs, índices e checks propostos (arquivo `db/app/migrations/0001_add_mile_point_lots.sql`).
- Observação: a migration proposta continua NÃO APLICADA — apenas commitada para revisão.
- Próximo passo: 1.3.14 — implementar motor FIFO e serviços transacionais (`lib/services/movements.ts`).
- Ação 1.3.14: consolidação do motor FIFO puro/in-memory e testes unitários (`lib/services/movements.ts`, `lib/services/__tests__/movements.test.ts`). Migration permanece proposta e NÃO APLICADA.

CI: para executar os testes de integração no GitHub Actions, configure o secret `TEST_DATABASE_URL` apontando para um DB de teste isolado e use o workflow manual `.github/workflows/integration-tests.yml`.

Execução manual do workflow (resumo):

- Adicionar secret `TEST_DATABASE_URL` em Settings → Secrets and variables → Actions.
- Ir em Actions → `Integration Tests - MovementsRepo` → Run workflow → selecionar branch `1.3.25.3-ci-manual-run-instructions` → Run.
- Conferir passos: `db:preflight:test`, `db:migrate:test:base`, `db:validate:test:base`, `db:migrate:test:ledger`, `db:validate:test:ledger`, `test:integration`.

Checklist (operator):

- Add secret `TEST_DATABASE_URL` in repo Settings → Secrets and variables → Actions.
- Actions → Integration Tests - MovementsRepo → Run workflow → branch `1.3.25.3-ci-manual-run-instructions` (or `1.3.25.4-ci-workflow-run-record`).
- Verify steps and collect sanitized logs.

Notas da versão 1.2.8:

- Corrigido warning ESLint em `lib/data/db-errors.ts` (remoção de export default anônimo).
- `/app/clubs` agora consulta `mile_clubs` no APP DB via `lib/data/clubs.ts` (Server Component, fallback seguro quando tabela ausente).
- `/app/settings` revisado para indicar tela preparatória sem persistência.
- Mantida separação: `organizations` resolvido via ADM; produto via APP.
- Recomenda-se remover fallbacks de desenvolvimento antes do deploy de produção.

Módulos conectados ao banco real:

- dashboard
- programs
- accounts
- entries
- purchases
- sales
- transfers
- clubs

## 2026-05-20 — 1.3.25.1

- Ampliados e validados localmente os testes de integração do `MovementsRepo` contra `TEST_DATABASE_URL`, cobrindo rollback transacional, consumo FIFO por lotes e transferência entre contas. Testes e validações locais passaram (`npm run test:integration`, `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`).
- Observação: staging/production/seed não foram usados; `USE_FIFO_MOVEMENTS_ENGINE` permanece OFF.
