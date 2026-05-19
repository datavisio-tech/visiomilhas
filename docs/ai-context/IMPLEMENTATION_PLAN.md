Atualização 1.3.14:

- Consolidação do motor FIFO puro/in-memory em `lib/services/movements.ts` com testes unitários em `lib/services/__tests__/movements.test.ts`.
- Status: 1.3.14 validado localmente (test/typecheck/lint/build OK). Persistência real (MovementsRepo Drizzle) adiada para 1.3.15.
- Próximo: 1.3.15 — alinhar schema↔migration, refinar `MovementsRepo` (tipos/contratos) e preparar implementação Drizzle com transações. Não aplicar migrations nesta etapa.
- Próximo: 1.3.16 — implementar `MovementsRepo` concreto usando Drizzle (transações) e preparar testes de integração em ambiente seguro. Não aplicar migrations nesta etapa de implementação.
  VisioMilhas — Plano de Implementação (resumo)

Objetivo: preparar o esquema e o plano para introduzir ledger + lotes (FIFO) no motor de milhas.

Versão alvo: 1.3.12 (preparação de schema) → 1.3.13 (motor FIFO)

Itens entregues nesta etapa (1.3.12):

- Atualização do schema Drizzle (`db/app/schema.ts`) com tabela proposta `mile_point_lots`.
- Adição de colunas auxiliares em `mile_entries` e `mile_transfers` para referenciar lotes/entries.
- Migration SQL proposta em `db/app/migrations/0001_add_mile_point_lots.sql` (não aplicada).
- Atualização de documentação e README para refletir a versão 1.3.12.

Próximo ciclo (1.3.13) — escopo técnico:

1. Implementar `lib/services/movements.ts` com transações que:
   - criem lotes em compras;
   - consumam lotes por venda/transferência (FIFO, respeitando expires_at);
   - criem entradas (`mile_entries`) com referência a lotes consumidos;
   - atualizem `program_accounts` como snapshot.
     Atualização 1.3.14:

- Consolidação do motor FIFO puro/in-memory em `lib/services/movements.ts` com testes unitários em `lib/services/__tests__/movements.test.ts`.
- Status: 1.3.14 validado localmente (test/typecheck/lint/build OK). Persistência real (MovementsRepo Drizzle) adiada para 1.3.15.

2. Cobrir com testes unitários e integrações locais (Vitest) para casos:
   - compra normal, compra parcelada, compra com fee/discount;
   - venda simples (FIFO parcial e total), venda insuficiente (erro);
   - transferência com/sem bônus e com paridade diferente.

3. Criar migrations adicionais se necessário (indexes/constraints), revisar performance em contas com muitos lotes.

4. Refatorar Server Actions e API Routes para consumir `lib/services/movements.ts` (1.3.14), reduzindo dependências e evitando runtime proxies.

Observações operacionais:

- NÃO aplicar migrations ou seeds nesta etapa. Gerar apenas arquivos de migration propostos para revisão.
- Planejar janelas de manutenção para aplicar migrations em bases grandes.

Riscos conhecidos:

- Operações de consumo FIFO em contas com muitos lotes podem exigir paginação/limitação em queries para performance.
- Migrações que adicionam colunas/índices podem impactar backups e replicação; coordenar com DBA se necessário.

Checklist de entrega 1.3.12:

- [x] Schema atualizado (`db/app/schema.ts`)
- [x] Migration proposta criada (`db/app/migrations/0001_add_mile_point_lots.sql`)
- [x] README atualizado para 1.3.12
- [x] Docs atualizados em `docs/ai-context`
- [x] Validações locais rodadas (test/typecheck/lint/build)
- [x] Commit local criado (sem push)

Atualização 1.3.13:

- Migration proposta refinada com FKs e checks (`db/app/migrations/0001_add_mile_point_lots.sql`).
- README atualizado para 1.3.13.
- Próximo passo: 1.3.14 — implementar `lib/services/movements.ts` (motor FIFO).

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

Atualização operacional (2026-05-16):

- Seed idempotente executado localmente com autorização explícita. A execução foi rodada duas vezes e validada; ver `docs/ai-context/CHANGELOG_AI.md` e `docs/ai-context/TODO_AI.md` para contagens e observações.
- Conexão inicial do dashboard ao banco (versão operacional `1.2.1`). `lib/server/dashboard.ts` e `app/app/dashboard/page.tsx` adicionados; build e validações executadas com sucesso. Ver `CHANGELOG_AI.md` para detalhes.

Progresso estimado (MVP1):

- Técnicos/base: 81% - 85%
- Utilizável por usuário: 60% - 68%

Atualização (1.2.2):

- `/app/programs` conectado ao APP DB com `lib/data/programs.ts` e página dinâmica.

Progresso estimado (MVP1) atualizado:

- Técnicos/base: 72% - 77%
- Utilizável por usuário: 48% - 58%

Atualização (1.2.3):

- `/app/accounts` conectado ao APP DB com `lib/data/accounts.ts` e página dinâmica.

Progresso estimado (MVP1) atualizado:

- Técnicos/base: 74% - 78%
- Utilizável por usuário: 50% - 60%

Atualização (1.2.4):

- `/app/entries` conectado ao APP DB com `lib/data/entries.ts` e página dinâmica.

Progresso estimado (MVP1) atualizado:

- Técnicos/base: 77% - 81%
- Utilizável por usuário: 55% - 63%

Atualização (1.3.10):

- Integrar formulários de criação nas páginas de compras, vendas e transferências.
- Criar endpoints API que reutilizam as Server Actions para permitir chamadas fetch a partir de Client Components.
- Testar manualmente fluxos de criação e validar revalidação de rotas.

Progresso estimado (MVP1) atualizado:

- Técnicos/base: 86% - 90%
- Utilizável por usuário: 72% - 80%
