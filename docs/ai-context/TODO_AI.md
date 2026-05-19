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

Status: padronização do runtime

- Arquivos `.nvmrc` e `.node-version` adicionados com `24`.
- Atualizar ambiente local para Node 24 e rodar `npm install` + `npm run test`.

Versionamento operacional:

- Regra: `MVP.Funcionalidade.Commit` (ex.: `1.1.7`).
- Versão operacional atual: `1.2.2`.

Atualização operacional:

- Versão operacional atual: `1.2.8` (fechamento de leituras e clubes).
- Próximo passo recomendado: `1.3.1` — iniciar CRUD operacional de compras, vendas e transferências.

Próximo passo recomendado: `1.2.4` — conectar `/app/entries` ao banco real.

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

Nota (2026-05-18): adicionado esqueleto de testes de integração em `tests/integration/movements.drizzle-repo.test.ts`.
Estes testes são placeholders e dependem de variáveis de ambiente (`APP_DATABASE_URL` ou `DATABASE_URL`) apontando para um banco de desenvolvimento isolado. Não execute `npm run test:integration` contra bancos de produção.

Status 1.3.20 — integração atômica da compra ao motor FIFO:

- Implementado `createDrizzleMovementsRepoFromClient(client)` em `lib/repositories/movements.drizzle-repo.ts` para criar um repo Drizzle que usa o `pg` client existente.
- `createPurchaseAction` em `app/app/purchases/actions.ts` foi atualizado para, quando `USE_FIFO_MOVEMENTS_ENGINE` estiver ativa, delegar ao `acquireMilesUseCase(..., txRepo)` executando o use-case dentro da mesma transação da compra.
- Pendências: validar a migration `db/app/migrations/0001_add_mile_point_lots.sql` em ambiente isolado, executar testes de integração e validar rollback antes de ativar a flag em staging.
