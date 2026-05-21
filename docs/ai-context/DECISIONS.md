# DECISIONS - VisioMilhas

Principais decisões técnicas para o MVP1:

- Framework: Next.js (App Router) — por integração com Server Components e rotas modernas.
- Linguagem: TypeScript com `strict` ativado — segurança de tipos e maior robustez.
- UI: Tailwind CSS + shadcn/ui — produtividade e componentes acessíveis.
- ORM: Drizzle ORM + drizzle-kit — tipagem forte para queries e compatibilidade com PostgreSQL.
- Banco: PostgreSQL para dados relacionais do MVP1.

Autenticação (escolha e justificativa):

- Escolha: Auth.js (antigo NextAuth) / Auth.js — justificativa:
  - Madura e amplamente adotada em projetos Next.js;
  - Suporta providers (Google OAuth) e email/senha via adaptadores;
  - Fácil integração com callbacks para criar organização, memberships e subscriptions no onboarding;
  - Comunidade e exemplos para integração com Stripe e adaptadores de banco.

Billing:

- Stripe como provedor de billing. Implementar estrutura inicial (customers, subscriptions, webhooks).

Multi-tenant:

- Tenant por organização. `organizationId` presente em todas as tabelas de negócio.
- Dados administrativos globais separados em `control_adm_saas_datavisio`.

Outras decisões:

- Tratar dinheiro em centavos (integers) em todas as tabelas/entradas.
- Tratar pontos como inteiros; evitar floats para cálculos monetários.
- Centralizar validações em `lib/validations` (Zod) e cálculos em `lib/calculations`.

- Decisão adicional: usar `lib/domain` para funções puras de cálculo relacionadas a milhas (CPM, impactos de compra/venda/transferência) e `lib/validations` (Zod) para validar entradas antes de chegar à camada de domínio. Essa separação facilita testes unitários e portabilidade.
  \
  Decisão adicional sobre testes:

- Adotar `Vitest` como framework de testes unitários para funções puras do domínio (rápido e integrado com Vite/esbuild).
- Manter testes de domínio separados dos testes de UI e integrações; usar `tests/domain` como localização preferida.

Decisão sobre runtime:

- Padronizar runtime em Node 24 LTS para o projeto, garantindo compatibilidade com ferramentas modernas e reduzindo dívida técnica.
- Evitar suporte a Node 21 (EOL) — forçar ambientes locais e CI para Node >=24.

Database migration & seeds decisions:

- Usar duas configurações separadas do Drizzle: `drizzle.adm.config.ts` e `drizzle.app.config.ts` para separar a base administrativa (ADM) da base da aplicação (APP).
- Fluxo principal de migrações: `generate` -> `migrate` (não usar `push` como padrão). Gerar migrações para cada DB separadamente e aplicar com `drizzle-kit migrate`.
- Seeds idempotentes em `db/seed/` e execução controlada via `npm run db:seed` (scripts usam `tsx` para rodar TypeScript diretamente).
- Introduzida variável `POSTGRES_ADMIN_DATABASE_URL` e script seguro `db:create-databases` para criar as bases necessárias (`controle_adm_saas_datavisio`, `visiomilhas_app`) antes de aplicar migrations. O admin URL deve apontar para uma base existente (eg. `postgres`) e o usuário deve ter permissão `CREATE DATABASE`.

Decisão sobre extrato (entries):

- Usar `mile_entries` como fonte inicial do extrato consolidado. Compras/vendas/transferências permanecem em suas tabelas e serão integradas ao extrato em etapas futuras; não será feita união complexa nesta fase.

Versionamento operacional:

- Regra: `MVP.Funcionalidade.Commit` (ex.: `1.1.7`)
- MVP atual: `1` (MVP1)
- Etapa/Funcionalidade atual: `1.1` — Fundação técnica, banco, migrations e seed inicial
- Versão operacional atual registrada: `1.1.6` — próxima incremental: `1.1.7`
- Versão operacional atual registrada: `1.2.1` — próxima incremental: `1.2.2`

Decisão operacional recente (1.2.8):

- Reforçar separação ADM/APP: resolver `organizations` apenas no ADM e ler dados do produto no APP.
- Erro `42P01` (relation does not exist) deve ser tratado explicitamente com `isMissingRelationError` e usado somente como fallback de desenvolvimento.

Mudanças de lint:

- Remover export default anônimo em helpers (ex.: `lib/data/db-errors.ts`) para evitar warnings `import/no-anonymous-default-export`.

Decisão adicional (2026-05-18):

- Não importar Server Actions diretamente em API Routes. Em vez disso, extrair a lógica transacional e de domínio para um service compartilhado (`lib/services/movements.ts`) que possa ser chamado tanto por Server Actions quanto por handlers de rotas API. Essa separação evita proxies/runtime issues (ex.: `TypeError: Cannot redefine property: $$id`) e mantém uma única fonte de verdade para regras de negócio.

- A estratégia de migração para essa decisão:
  1. Criar `lib/services/movements.ts` com contratos e implementações transacionais.
  2. Atualizar Server Actions para delegarem ao service (sem alterar a assinatura pública das actions).
  3. Atualizar `app/api/*/route.ts` para usar o mesmo service e remover import estático de actions.
  4. Validar via testes unitários e manuais.

- 2026-05-18: Preparação do schema 1.3.12 — `mile_point_lots` adicionada ao schema Drizzle e migration proposta criada (`db/app/migrations/0001_add_mile_point_lots.sql`). Migration não foi aplicada; objetivo é revisar e validar antes de aplicar em ambientes controlados.
- 2026-05-18: Refinamento da migration (1.3.13) — a migration proposta foi atualizada com FKs, índices e checks propostos em `db/app/migrations/0001_add_mile_point_lots.sql`. A decisão foi incluir constraints que reforcem integridade, mantendo `ON DELETE RESTRICT` em relações financeiras e `ON DELETE SET NULL` quando apropriado para origem de lotes. Migration está proposta para revisão e NÃO APLICADA.

- 2026-05-18: Consolidação do motor FIFO puro (1.3.14) — o motor de movimentações (`lib/services/movements.ts`) foi consolidado como um service desacoplado da persistência, validado por testes unitários in-memory. A implementação concreta do `MovementsRepo` com Drizzle e transações fica para 1.3.15.
- 2026-05-18: Consolidação do motor FIFO puro (1.3.14) — o motor de movimentações (`lib/services/movements.ts`) foi consolidado como um service desacoplado da persistência, validado por testes unitários in-memory. A implementação concreta do `MovementsRepo` com Drizzle e transações fica para 1.3.15.

- 2026-05-18: Integração atômica da compra ao motor FIFO (1.3.20)

- Decisão: integrar o fluxo de compra/aquisição ao motor FIFO como primeiro caso de uso atômico.
- Motivo: compra cria entry + lot de forma determinística, é o fluxo mais simples para validar transação end-to-end.
- Implementação: `createPurchaseAction` delega ao `acquireMilesUseCase(..., txRepo)` quando `USE_FIFO_MOVEMENTS_ENGINE` estiver ativa; o `txRepo` é criado por `createDrizzleMovementsRepoFromClient(client)` que usa o `pg` client corrente, evitando abertura de nova conexão/transaction.
- Segurança: a feature flag permanece desligada por padrão; a integração só roda quando explicitamente ativada em staging após validação da migration.
- Garantia transacional: `acquireMilesUseCase` é executado dentro da mesma transação do `createPurchaseAction` (rollback único em caso de falha).
- Próximo: validar em staging com a migration `db/app/migrations/0001_add_mile_point_lots.sql` aplicada e testar rollback/rollback scenarios.
- Planejamento 1.3.15: implementar `MovementsRepo` usando Drizzle, garantir operações transacionais (atomicidade/rollback) e alinhar migrations/constraints. Esta etapa requer validação em DB de desenvolvimento isolado e backup antes de aplicar migrations em produção.
- 1.3.16: Implementação concreta do `MovementsRepo` com Drizzle realizada em `lib/repositories/movements.drizzle-repo.ts`. Mantém-se a prática de aplicar constraints/índices via migrations SQL; migratons não foram aplicadas automaticamente nesta etapa.

Nota operacional (2026-05-20):

- As bases `DATABASE_STAGING` e `DATABASE_TEST` foram criadas pelo usuário e devem ser acessadas exclusivamente por `STAGING_DATABASE_URL` e `TEST_DATABASE_URL` (armazenadas em secrets/`.env.local` ou no cofre do CI). Nunca apontar `STAGING_DATABASE_URL`/`TEST_DATABASE_URL` para produção.

Decisões recentes (1.3.21):

- A compra/aquisição foi o primeiro fluxo real integrado ao motor FIFO e protegido por testes unitários.
- A feature flag `USE_FIFO_MOVEMENTS_ENGINE` permanece OFF por padrão; ativação requer validação em staging e decisão explícita.
- O rollback foi coberto por testes unitários com mocks (simulação) — o rollback em produção precisa ser validado em DB isolado com a migration aplicada.
- As integrações de venda/consumo/transferência devem aguardar validação bem-sucedida em staging (aplicação da migration, testes de integração e QA) antes de serem integradas ao motor FIFO.

### 2026-05-20 — decisão complementar 1.3.25.1

- Confirmar testes de integração do `MovementsRepo` contra `TEST_DATABASE_URL` (rollback, FIFO, transfer) antes de qualquer ativação de flag em ambientes compartilhados. Testes foram executados e validados localmente.
- Permanecer com `USE_FIFO_MOVEMENTS_ENGINE` OFF até validação em staging/CI com evidências sanitizadas.

### 2026-05-20 — decisão operacional CI (1.3.25.2)

- Criar workflow manual (`workflow_dispatch`) para executar testes de integração contra `TEST_DATABASE_URL` no GitHub Actions; o job valida a presença do secret `TEST_DATABASE_URL`, aplica/valida migrations de teste e roda `npm run test:integration`.
- O workflow não deve expor secrets, não executa seeds e mantém `USE_FIFO_MOVEMENTS_ENGINE=0` durante a execução.
