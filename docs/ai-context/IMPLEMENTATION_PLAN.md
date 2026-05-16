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
