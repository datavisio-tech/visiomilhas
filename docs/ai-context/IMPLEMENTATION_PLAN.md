# IMPLEMENTATION_PLAN - MVP1 (VisioMilhas)

Fase 0: documentação e setup

- Criar /docs/ai-context/ (feito)
- Inicializar scaffold Next.js + TypeScript + Tailwind
- Configurar .env.example, .gitignore

Fase 1: auth, tenant e onboarding

- Implementar Auth.js (email/senha) + Google OAuth
- Middleware de proteção e checagem de tenant/membership
- Criação automática de `organization` no primeiro registro + papel `owner`
- Criar subscription trialing de 15 dias

Fase 1.5: domínio e validações (atual)

Adição de testes (Vitest):

- Adotar Vitest para testes unitários de funções puras do domínio.
- Criar suite de testes em `tests/domain` cobrindo `miles-calculations`.

Fase 2: landing page

Fase 3: programas e contas

- Schemas Drizzle (loyalty_programs, program_accounts)
- CRUD de programas e contas

Fase 4: lançamentos

- mile_entries CRUD, validação Zod, regras de saldo

Fase 5: compras, vendas e transferências

- Implementar telas de compras (pendente/recebido)
- Implementar vendas com cálculo de custo/lucro/margem
- Transferências com bônus e recalculo de CPM

Fase 6: clubes

- CRUD de clubes e geração manual de crédito

Fase 7: dashboard

- Cards principais, gráficos simples (recharts), filtros por período

Fase 8: billing/trial

- Estrutura Stripe (customers, webhooks), plan seeds
- Banner de trial e lógica de migração para free_limited

Fase 9: deploy e hardening

- GitHub Actions (lint/typecheck/build)
- Preparar deploy remoto seguro (secrets, proxy reverse)

Observação:

- Priorizar entregas mínimas por fase com testes e seeds.

DB: migrações e seeds (operação segura)

- Separar migrações/saídas por database: `drizzle.adm.config.ts` e `drizzle.app.config.ts`.
- Fluxo: `generate` -> `migrate` (usar `drizzle-kit migrate`); evitar `push` como padrão.
- Seeds idempotentes em `db/seed/` e execução controlada via `npm run db:seed` que exige autorização explícita (`VISIOMILHEIRO_ALLOW_DB_SEED=1` ou `--apply`).
- Não executar migrações ou seeds sem aprovação explícita do time de desenvolvimento/DBA.

Status operacional (2026-05-16):

- Migrations iniciais geradas e aplicadas com sucesso para ADM e APP usando os arquivos de configuração separados (`drizzle.adm.config.ts` e `drizzle.app.config.ts`).
- Arquivos de migration gerados:
  - `db/adm/migrations/0000_strange_thor_girl.sql`
  - `db/app/migrations/0000_misty_kulan_gath.sql`
- Seeds: ainda pendentes e não foram executados nesta etapa (requer autorização explícita).
