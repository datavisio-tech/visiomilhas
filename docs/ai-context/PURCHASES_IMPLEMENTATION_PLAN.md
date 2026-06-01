# Purchase Tracking — Implementation Plan (Foundation)

Resumo das decisões e deliverables da Fase Foundation (Release 4.3-A).

## O que foi criado nesta fase

- Scaffold do módulo `src/modules/purchases` com `domain`, `application`, `infrastructure`, `mcp` e `tests`.
- Tipos de domínio em `src/modules/purchases/domain/types.ts`.
- Contracts de repositório em `src/modules/purchases/application/contracts.ts`.
- Stubs de repositório em `src/modules/purchases/infrastructure/repository.stub.ts`.
- MCP placeholder em `src/modules/purchases/mcp/purchases-journey.ts`.

## Banco de dados

- Novas tabelas Drizzle adicionadas em `db/app/schema.ts`:
  - `partner_stores`
  - `partner_campaigns`
  - `purchase_records`
  - `purchase_status_history`
  - `purchase_evidences`
- Migration SQL criada: `db/app/migrations/0002_purchases_tracking.sql`.
- Seed inicial criado: `db/seed/partners-seed.ts` (invocado por `db/seed/app-seed.ts`).

## Public assets

- Diretório `public/partners` criado com `default-store.svg` placeholder.

## Arquitetura e decisões principais

- Fragmentação em domínio/aplicação/infrastructure segue padrão do repositório.
- Mantivemos a definição de colunas no `db/app/schema.ts` (Drizzle) e aplicamos constraints/índices básicos via migration SQL, seguindo convenção do projeto.
- Seeds limitados a `partner_stores` na foundation; campanhas e purchases serão adicionados por seeds de cenário (fase 2).
- Repositórios concretos serão implementados na fase de infraestrutura (persistência/queries otimizadas).

## Riscos e pendências para próxima fase (UI e Cockpit)

- Normalização de índices e FKs: migrations atuais criam as tabelas e índices básicos; ajustes de performance e FKs dependem de validação com dados reais.
- Mapeamento entre `partner_campaigns.program_id` e `loyalty_programs.id` precisa de coordenação com catálogo de programas (possível necessidade de dados manuais durante seed).
- Políticas de retenção e GDPR para `purchase_evidences.file_url`/anexos devem ser definidas antes do upload PRO.
- Regras de negócios completas (status transitions, automatic credit generation) ainda não implementadas.

## Próximos passos recomendados

1. Implementar repositórios específicos com Drizzle queries paginadas e testes unitários.
2. Criar seeds de campanhas e um seed de exemplo de `purchase_records` para validar pipeline.
3. Implementar endpoints API (server actions) e testes MCP para CRUD de purchases.
4. Implementar UI do cockpit e drawer (fase 2).
