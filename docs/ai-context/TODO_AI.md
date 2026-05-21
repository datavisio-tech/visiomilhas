# TODO_AI - Pendências e próximas ações

Prioridades imediatas:

1. Scaffold do projeto Next.js + TypeScript + Tailwind + shadcn/ui
2. Criar schemas Drizzle para `control_adm_saas_datavisio` e `visiomilhas_app`
3. Implementar autenticação (Auth.js/NextAuth) e onboarding com trial de 15 dias
4. Seeds iniciais (planos e programas de fidelidade)

Pendências de integração:

- Configurar Stripe em ambiente de teste (webhooks de staging)
- Configurar CI (GitHub Actions) com secrets seguros

Funcionalidades futuras (backlog):

- Importação CSV/Excel
- Relatórios avançados e dashboards customizáveis
- Integração com MongoDB para logs/eventos/IA
- Importadores e conectores para programas específicos (quando permitido)

Notas operacionais:

- Validar preços e intervals de cobrança como configuração via seed/env.
- Priorizar testes de multi-tenant e isolamento de dados.

Concluído recentemente:

- Implementar camada de domínio e validações Zod (lib/domain, lib/validations).

Próximos itens prioritários:

- Criar testes unitários para `lib/domain`.
- Implementar Server Actions / API routes que utilizem as validações e domínio.
- Implementar UI inicial do dashboard e CRUDs.
- Integrar autenticação e onboarding.
- Configurar Stripe e billing.
  \
  Status recente:

- `.gitignore` e `.env.example` criados na raiz do projeto com placeholders seguros (16/05/2026).
- Testes unitários do domínio adicionados com Vitest. Arquivos em `tests/domain` (16/05/2026).

Próximo passo recomendado: provisionar `.env.local` em staging/production e configurar secrets no CI.

- Criar `docs/ai-context/STAGING_MIGRATION_RUNBOOK.md` (feito)

2026-05-20 — 1.3.24.1: preparar scripts de schema base em staging

- Criar `scripts/apply-staging-base-migrations.ts` (feito)
- Criar `scripts/validate-staging-base-schema.ts` (feito)
- Criar `scripts/validate-staging-ledger-migration.ts` (feito)
- Revisar e autorizar execução em etapa seguinte.
- Validar `db/app/migrations/0001_add_mile_point_lots.sql` em revisão (pendente)
- Planejar execução controlada em staging (pendente)

Status: padronização do runtime

- Arquivos `.nvmrc` e `.node-version` adicionados com `24`.
- Atualizar ambiente local para Node 24 e rodar `npm install` + `npm run test`.

Versionamento operacional:

- Regra: `MVP.Funcionalidade.Commit` (ex.: `1.1.7`).
- Versão operacional atual: `1.2.2`.

Atualização operacional:

- Versão operacional atual: `1.2.8` (fechamento de leituras e clubes).
- Próximo passo recomendado: `1.3.1` — iniciar CRUD operacional de compras, vendas e transferências.

2026-05-20 — 1.3.25.1 (ampliação dos testes de integração MovementsRepo)

- Implementar e validar localmente testes de integração do `MovementsRepo` contra `TEST_DATABASE_URL` (rollback, FIFO, transfer) — CONCLUÍDO localmente;
- Próximo: coletar evidências sanitizadas e integrar regressão em CI contra DB de teste isolado.

Status recente:

- `/app/accounts` conectado ao APP DB (1.2.3). Ver `CHANGELOG_AI` para detalhes.
- `/app/entries` conectado ao APP DB (1.2.4).

Status recente:

- `/app/programs` conectado ao APP DB (1.2.2). Ver `CHANGELOG_AI` para detalhes.

DB: status recente (2026-05-16):

- Migrations iniciais geradas e aplicadas para ADM e APP (ver `db/adm/migrations/0000_strange_thor_girl.sql` e `db/app/migrations/0000_misty_kulan_gath.sql`).
- Seeds: pendentes — não foram executados nesta etapa e exigem autorização explícita para rodar.

DB: migrações, generate e seeds

- Adicionar script seguro `db:create-databases` e variável `POSTGRES_ADMIN_DATABASE_URL` usada para criar apenas as bases necessárias (`controle_adm_saas_datavisio` e `visiomilhas_app`) quando ausentes. O admin URL é sensível e requerido apenas para esta operação.

Seed operacional executado (16/05/2026):

- `db:seed` foi executado com autorização explícita e rodado duas vezes para validar idempotência.
- Contagens iniciais: todas as tabelas listadas retornaram 0.
- Resultado final: ADM e APP populados com dados demo; ver `CHANGELOG_AI` para contagens sanitizadas.
- Observação: a primeira execução inseriu apenas dados ADM; a segunda finalizou inserção APP; uma execução adicional confirmou idempotência (sem alterações nas contagens).

Próximo passo recomendado: conectar as primeiras telas ao banco real e validar fluxos com dados demo.

Status recente (2026-05-18):

- Versão operacional `1.3.10` integrada: formulários de compras, vendas e transferências implementados e conectados às Server Actions via endpoints API.
- Próximo item: testes manuais de criação e ajustes UX/erros.

Status 1.3.13 — Refinamento do schema/migration:

- Schema Drizzle mantido e migration proposta refinada (`db/app/migrations/0001_add_mile_point_lots.sql`) com FKs, índices e checks sugeridos.
- Migration continua NÃO APLICADA.
- Próximo passo: 1.3.14 — implementar `lib/services/movements.ts` (motor FIFO) e testes unitários.

Pendências (relacionadas a 1.3.21):

- Provisionar DB isolado/staging para validar `db/app/migrations/0001_add_mile_point_lots.sql`.
- Rodar `npm run test:integration` contra o DB isolado após aplicar a migration.
- Validar rollback real em transações que envolvem `createPurchaseAction` + `acquireMilesUseCase`.
- Ativar `USE_FIFO_MOVEMENTS_ENGINE` em staging somente após validação completa.
- QA da compra/aquisição em staging com dados demo (sem afetar produção).
- Planejar integração de venda/consumo/transferência após sucesso em staging.
- Revisar implicações contábeis de custo/margem antes de ativar em produção.
- Configurar secret `TEST_DATABASE_URL` no GitHub e executar o workflow `.github/workflows/integration-tests.yml` manualmente para validar regressão CI.
  - Observação: este agente não configura o secret automaticamente. Após configurar o secret, executar manualmente o workflow via GitHub (workflow_dispatch) e coletar artefatos sanitizados.

2026-05-20 — 1.3.25.3 (execução manual do workflow CI)

- Adicionar instruções para operador:
  1. GitHub → Settings → Secrets and variables → Actions → New repository secret → `TEST_DATABASE_URL`.
  2. Actions → `Integration Tests - MovementsRepo` → Run workflow → selecionar branch `1.3.25.3-ci-manual-run-instructions` → Run.
  3. Conferir logs sanitizados e validar passos (`preflight`, `migrate`, `validate`, `test:integration`).

  Checklist rápido para operador (copiar/colar):
  1. GitHub → Settings → Secrets and variables → Actions → New repository secret
  - Nome: TEST_DATABASE_URL
  - Valor: (URL segura do test_db)
  2. Actions → Integration Tests - MovementsRepo → Run workflow → selecionar branch `1.3.25.3-ci-manual-run-instructions` → Run
  3. Aguardar execução e confirmar que os passos passaram; coletar logs sanitizados.

2026-05-20 — 1.3.26 (QA compra FIFO em staging)

- Branch de trabalho: `1.3.26-qa-compra-fifo-staging`
- Preflight staging: concluído com `current_database(): staging_db`
- Validação base staging: concluída
- Validação ledger staging: concluída
- Próximo passo: executar validações locais (`test`, `typecheck`, `lint`, `build`) e depois o checklist manual de QA da compra FIFO em staging
- Regra: não ativar `USE_FIFO_MOVEMENTS_ENGINE` em produção; qualquer ativação em staging depende de nova autorização explícita

2026-05-20 — 1.3.26.1 (preparação do QA manual FIFO)

- Checklist de QA expandido com roteiro de ativação da flag em staging, rollback operacional e parâmetros de validação.
- Adicionado script npm `db:validate:staging:purchase-fifo`.
- Próximo passo: aguardar o operador ativar `USE_FIFO_MOVEMENTS_ENGINE=1` apenas em staging, registrar os IDs da compra e então executar a validação read-only.

Status 1.3.14 — Consolidação do motor FIFO puro:

- Motor FIFO consolidado em `lib/services/movements.ts` com testes unitários em `lib/services/__tests__/movements.test.ts`.
- Pendências para 1.3.15:
  - Alinhar `db/app/schema.ts` com constraints (FKs, checks, índices) presentes na migration proposta.
  - Implementar `MovementsRepo` concreto com Drizzle e transações.
  - Testar integração com DB de desenvolvimento isolado e preparar plano de aplicação de migration.

Prioridade imediata (1.3.11) — pausa arquitetural:

- Mapear schema atual (`db/app/schema.ts`) e listar campos críticos para motor de milhas.
- Produzir especificação de `mile_point_lots` (colunas e índices) sem aplicar migrations.
- Projetar e prototipar `lib/services/movements.ts` (contratos e transações) para centralizar lógica de compra/venda/transferência.
- Refatorar Server Actions e API Routes para chamarem o service compartilhado (evitar import estático de Server Actions em rotas para mitigar o erro `$$id`).
- Cobrir com testes unitários e integração local antes de aplicar migrations.

Itens prioritários 1.3.15 (preparação de persistência do motor FIFO):

- Implementar `MovementsRepo` concreto usando Drizzle (assinar métodos e tipos, transações e rollback).
- Alinhar `db/app/schema.ts` e `db/app/migrations/0001_add_mile_point_lots.sql` quanto a nomes/constraints/índices (sem aplicar migrations automaticamente).
- Adicionar testes de integração em DB de desenvolvimento isolado (não rodar seed em produção durante validação).

Status 1.3.16 (implementação do repo):

- `lib/repositories/movements.drizzle-repo.ts` implementado como adapter Drizzle.
- Próximo: preparar testes de integração em DB de desenvolvimento isolado e documento de rollback/aplicação de migration.

2026-05-20 — Uso controlado de skills locais (decisão operacional)

- Registrar as skills locais instaladas em `.claude/skills` e seu escopo de uso no agente residente.
- Skills detectadas: `code-review`, `frontend-patterns`, `saas-multi-tenant`, `security-review`, `test`.
- Ação: atualizar `.github/agents/visiomilhas.agent.md` com regras e limites (feito localmente).
- Validação: rodar `npm run lint` e `npm run typecheck` após alterações documentais.

Pendência adicional — diretório `.claude`:

- O diretório `.claude/` existe localmente e contém skills auxiliares (SKILL.md e implementações).
- Decisão atual: **não commitar `.claude/`**; registrar como pendência para avaliação futura.
- Ação recomendada antes de versionar `.claude`:
  1. Revisar cada `SKILL.md` para garantir que não exponha segredos, URLs ou instruções operacionais perigosas.
  2. Validar permissões de rede/IO esperadas pelas skills.
  3. Documentar quais skills, se any, serão versionadas e quais permanecerão locais.

Nota (2026-05-18): adicionado esqueleto de testes de integração em `tests/integration/movements.drizzle-repo.test.ts`.
Estes testes são placeholders e dependem de variáveis de ambiente (`APP_DATABASE_URL` ou `DATABASE_URL`) apontando para um banco de desenvolvimento isolado. Não execute `npm run test:integration` contra bancos de produção.

Status 1.3.20 — integração atômica da compra ao motor FIFO:

- Implementado `createDrizzleMovementsRepoFromClient(client)` em `lib/repositories/movements.drizzle-repo.ts` para criar um repo Drizzle que usa o `pg` client existente.
- `createPurchaseAction` em `app/app/purchases/actions.ts` foi atualizado para, quando `USE_FIFO_MOVEMENTS_ENGINE` estiver ativa, delegar ao `acquireMilesUseCase(..., txRepo)` executando o use-case dentro da mesma transação da compra.
- Pendências: validar a migration `db/app/migrations/0001_add_mile_point_lots.sql` em ambiente isolado, executar testes de integração e validar rollback antes de ativar a flag em staging.
