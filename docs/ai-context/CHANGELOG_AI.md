# CHANGELOG_AI

## 2026-05-21 — 1.3.26.4 — regularização documental antes do QA staging

Objetivo:

- Regularizar o agente residente e registrar o estado operacional antes de retomar o QA staging.

Notas:

- O runtime da página de compras já foi validado na etapa anterior sem reproduzir `Cannot redefine property: $$id`.
- `USE_FIFO_MOVEMENTS_ENGINE` segue OFF nesta etapa.
- `.claude/` continua não rastreado e fora de commit.
- O QA staging permanece pendente de autorização explícita.

## 2026-05-21 — 1.3.26.3 — validação de runtime da página de compras

Objetivo:

- Validar o runtime da página de compras antes de retomar o QA FIFO em staging.

Arquivos criados/alterados nesta etapa:

- `docs/ai-context/DAILY_CHECKPOINT.md`
- `docs/ai-context/TODO_AI.md`
- `docs/ai-context/CHANGELOG_AI.md`
- `docs/ai-context/STAGING_QA_FIFO_PURCHASE.md`

Decisões tomadas:

- Não ativar `USE_FIFO_MOVEMENTS_ENGINE`.
- Não executar compra de teste.
- Não tocar em UI, schema, migrations, seeds ou banco real nesta etapa.

Riscos:

- A validação foi somente de runtime local; QA staging segue pendente de autorização para reativar a flag.

Pendências:

- Retomar o roteiro de QA em staging apenas após nova autorização.
- Manter `.claude/` fora de commit.

Validações executadas:

- `npm run test` — OK.
- `npm run typecheck` — OK.
- `npm run lint` — OK.
- `npm run build` — OK.
- Runtime local da página `/app/purchases` — OK.

## 2026-05-16 — MVP1 - Bootstrap inicial

Objetivo:

Arquivos criados/alterados nesta etapa:

Decisões tomadas:

Riscos:

Pendências:

Validações esperadas:

## 2026-05-16 — Configuração de ambiente e gitignore

Objetivo:

- Adicionar `.gitignore` e `.env.example` na raiz do projeto com placeholders seguros e instruções de não commit de arquivos sensíveis.

Arquivos criados/alterados nesta etapa:

- `.gitignore` (raiz) — inclui padrões para `.env` e arquivos de build/logs.
- `.env.example` (raiz) — lista de variáveis de ambiente com placeholders seguros.
- `docs/ai-context/ENVIRONMENT.md` — atualizado com variáveis documentadas.
- `docs/ai-context/TODO_AI.md` — atualizado com passo concluído.

Notas:

- Não foram adicionados valores reais ou secrets; apenas placeholders.

## 2026-05-16 — Scaffold Next.js / TypeScript / Tailwind

Objetivo:

- Criar scaffold inicial do projeto com App Router, TypeScript strict e Tailwind.

Arquivos criados/alterados nesta etapa:

- `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.js`, `postcss.config.js`
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- `README.md`
- `drizzle.config.ts` e schemas iniciais em `db/adm/schema.ts` e `db/app/schema.ts`

Notas:

- Preservadas as pastas e arquivos existentes em `docs/ai-context`.
- Próximo passo recomendado: rodar `npm install` e validar `npm run dev` em ambiente local com `.env.local` configurado (não commitar `.env.local`).

## 2026-05-16 — Domain layer: validations and calculations

Objetivo:

- Implementar camada de domínio e validações Zod para o MVP1 (programas, contas, lançamentos, compras, vendas, transferências) e funções puras de cálculo de milhas.

Arquivos criados/alterados nesta etapa:

- `lib/domain/miles-types.ts`
- `lib/domain/miles-errors.ts`
- `lib/domain/miles-calculations.ts`
- `lib/domain/index.ts`
- `lib/utils/money.ts`
- `lib/validations/programs.ts`
- `lib/validations/miles.ts`
- `lib/validations/purchases.ts`
- `lib/validations/sales.ts`
- `lib/validations/transfers.ts`

Resumo técnico:

- Tipos TypeScript estritos para operações de milhas e enums literais.
- Validações Zod para entradas de domínio (evitar dados inválidos vindos do client).
- Funções puras para calcular CPM, impacto de compras, vendas e transferências.
- Erros de domínio explícitos para tratamento em camadas superiores.

Decisões:

- Usar Zod para validação das entradas do domínio.
- Manter `lib/domain` livre de dependências de Next.js ou banco.

Riscos:

- Funções dependem de dados numéricos inteiros; garantir sanitização antes de chamar em APIs.

Pendências:

- Adicionar testes unitários para cálculos e validar corner-cases (zerodivision, arredondamentos).

## 2026-05-16 — Testes unitários do domínio (Vitest)

Objetivo:

- Introduzir testes unitários para as funções puras em `lib/domain`, garantindo cálculos de CPM, impacto de compras, vendas e transferências.

Arquivos criados/alterados nesta etapa:

- `vitest.config.ts` — configuração mínima do Vitest (ambiente node).
- `tests/domain/miles-calculations.test.ts` — testes unitários para `lib/domain/miles-calculations.ts`.
- `package.json` — scripts `test`, `test:watch`, `test:coverage` adicionados.

Notas:

- Vitest foi instalado como dependência de desenvolvimento.
- Testes cobrem casos de borda, erros de domínio e arredondamentos.

## 2026-05-16 — Padronização do runtime: Node 24 LTS

Objetivo:

- Padronizar o runtime para Node 24 LTS (versão alvo do projeto) para evitar incompatibilidades com dependências modernas (Vitest, Vite, rolldown).

Arquivos criados/alterados nesta etapa:

- `.nvmrc` — `24`
- `.node-version` — `24`
- `package.json` — `engines` definido para `node: ">=24 <25"` e `npm: ">=10"`.

Notas:

- A alteração de runtime exige que o ambiente local seja atualizado para Node 24 antes de rodar os testes.
- Não foi feito `npm install` nem `npm run test` com Node 24 neste ciclo; instruções para atualização estão no README operacional.

## 2026-05-16 — Environment and checks: added APP_NAME, ran typecheck & lint

Objetivo:

- Garantir que o projeto compila e que as verificações básicas estão ok; documentar `APP_NAME`.

Ações executadas:

- Adicionado `APP_NAME=VisioMilhas` em `.env.example` (placeholder público).
- Documentado `APP_NAME` em `docs/ai-context/ENVIRONMENT.md`.
- Verificado que `.gitignore` protege `.env` e variantes.
- Instaladas dependências necessárias para checagens (`zod`, `drizzle-orm`, `drizzle-kit`, `@types/react`, `@types/react-dom`, `@types/node`).
- Corrigidos issues de TypeScript e ESLint em `app/layout.tsx`, `lib/utils/money.ts`, `lib/domain/miles-calculations.ts` e validações Zod.
- Rodado `npm run typecheck` — sem erros.
- Rodado `npm run lint` — sem erros.

Arquivos alterados nesta verificação:

- `.env.example` (APP_NAME added)
- `docs/ai-context/ENVIRONMENT.md` (APP_NAME documented)
- `tsconfig.json` (next lint suggested changes; preserved `strict: true`)
- `.eslintrc.json` (added minimal config to run lint)

Notas:

- Não foram adicionados secrets; todas as mudanças são código e documentação.
- Próximo passo: adicionar testes unitários para `lib/domain`.

- Próximo passo recomendado: provisionar um arquivo `.env.local` seguro no ambiente de deploy/staging e configurar CI secrets.

## 2026-05-16 — Preparação de migrations e seeds (Drizzle)

Objetivo:

- Separar configurações Drizzle para bases ADM e APP; adicionar seeds idempotentes.

Arquivos criados/alterados nesta etapa:

- `drizzle.adm.config.ts`, `drizzle.app.config.ts`
- `db/seed/index.ts`, `db/seed/check-env.ts`, `db/seed/adm-seed.ts`, `db/seed/app-seed.ts`, `db/seed/demo-data.ts`
- `db/adm/client.ts`, `db/app/client.ts` (exportando pools e clients para uso server-side)
- `package.json` — scripts `db:adm:generate`, `db:app:generate`, `db:adm:migrate`, `db:app:migrate`, `db:generate`, `db:migrate`, `db:seed`, `db:check-env`

Notas:

- Seeds são idempotentes e `db/seed/index.ts` exige autorização explícita (`VISIOMILHEIRO_ALLOW_DB_SEED=1` ou `--apply`).
- Migrations NÃO foram executadas automaticamente e nenhum seed foi rodado sem autorização.
- Rodar lint/typecheck/build após scaffold.

## 2026-05-16 — Migrations iniciais geradas e aplicadas

Resumo das ações operacionais (não expõe secrets):

- Migrations geradas: `db/adm/migrations/0000_strange_thor_girl.sql` e `db/app/migrations/0000_misty_kulan_gath.sql`.
- Migrations aplicadas com sucesso em ambas as databases (ADM e APP) usando os scripts existentes do `package.json` (`db:migrate`).
- Databases afetadas: `controle_adm_saas_datavisio` (ADM) e `visiomilhas_app` (APP).
- Principais tabelas criadas (estrutura apenas, sem dados):
  - ADM: `global_users`, `organizations`, `organization_memberships`, `plans`, `subscriptions`, `billing_events`, `admin_audit_logs`.
  - APP: `loyalty_programs`, `program_accounts`, `mile_entries`, `mile_purchases`, `mile_sales`, `mile_transfers`, `mile_clubs`, `beneficiaries`, `business_contacts`.
- Seeds: permanecem pendentes e não foram executados nesta etapa.
- Validações: `npm run test`, `npm run typecheck` e `npm run lint` passaram após aplicar migrations.

## 2026-05-18 — Integração atômica da compra ao motor FIFO (1.3.20)

## 2026-05-20 — Preparação da etapa 1.3.22 (staging/migration)

Objetivo:

- Preparar o runbook e documentação para validar `db/app/migrations/0001_add_mile_point_lots.sql` em staging isolado (não aplicar nesta etapa).

Arquivos criados/alterados nesta etapa:

- `docs/ai-context/STAGING_MIGRATION_RUNBOOK.md` — roteiro operacional para validação segura da migration.
- `.env.example` — placeholders adicionados: `STAGING_DATABASE_URL`, `TEST_DATABASE_URL`.
- `docs/ai-context/ENVIRONMENT.md` — adição de seção sobre staging/test DB e regras de uso.
- `docs/ai-context/IMPLEMENTATION_PLAN.md` — adicionado plano 1.3.22.

Notas:

- Migração permanece NÃO APLICADA. Nenhuma alteração em código da aplicação nem seeds aplicadas.

## 2026-05-20 — 1.3.22 complementar — alinhamento de variáveis de ambiente

Objetivo:

- Padronizar `.env.example` com placeholders seguros para `STAGING_DATABASE_URL`, `TEST_DATABASE_URL`, `DATABASE_STAGING` e `DATABASE_TEST`.
- Atualizar documentação para explicar o uso e as regras de staging/test.

Arquivos alterados nesta etapa complementar:

- `.env.example` — atualizada com padrão de variáveis para staging/test/admin/app
- `docs/ai-context/ENVIRONMENT.md` — seção adicionada com padrões e regras
- `docs/ai-context/STAGING_MIGRATION_RUNBOOK.md` — validações complementares para variáveis de DB

Nota: nenhuma migration foi aplicada; alterações são documentais e de preparação.

## 2026-05-20 — 1.3.26 — preparo e validação inicial de QA FIFO em staging

Objetivo:

Ações executadas nesta rodada:

Resultado resumido:

Pendências:

Notas de segurança:

## 2026-05-20 — Uso controlado de skills locais (decisão operacional)

Objetivo:

- Definir regras de uso para as skills locais instaladas em `.claude/skills`, garantindo que sejam ferramentas de apoio e não autoridade operacional.

Ações:

- Documentado o escopo e limites das skills locais no agente residente: `.github/agents/visiomilhas.agent.md` (seção `Uso controlado de skills locais`).
- Skills detectadas: `code-review`, `frontend-patterns`, `saas-multi-tenant`, `security-review`, `test`.

Decisão:

- As skills locais podem ser consultadas, mas não podem autorizar push/PR/merge/deploy/seed/migration/alterações em produção sem autorização explícita do operador.
- Em caso de conflito entre a sugestão da skill e as regras do agente ou docs operacionais, o agente registra o conflito e pede confirmação humana.

Riscos mitigados:

- Evita automações perigosas que possam alterar DBs, expor secrets ou empurrar mudanças sem revisão.

Próxima etapa:

- Registrar esta decisão em `docs/ai-context/DECISIONS.md`, `docs/ai-context/DAILY_CHECKPOINT.md` e `docs/ai-context/TODO_AI.md`.

## 2026-05-20 — 1.3.26.1 — preparação do QA manual da compra FIFO em staging

Objetivo:

- Preparar o roteiro operacional para o QA manual da compra FIFO em staging, incluindo ativação controlada da flag, parâmetros de validação read-only e plano de rollback.

Ações executadas nesta rodada:

- Revisado e expandido o checklist [docs/ai-context/STAGING_QA_FIFO_PURCHASE.md](docs/ai-context/STAGING_QA_FIFO_PURCHASE.md).
- Atualizado o script read-only [scripts/validate-staging-purchase-fifo.ts](scripts/validate-staging-purchase-fifo.ts) para validar `current_database()` e aceitar parâmetros seguros opcionais.
- Adicionado o script npm [package.json](package.json) para `db:validate:staging:purchase-fifo`.
- Atualizados os documentos operacionais para registrar flag ON apenas em staging e plano de rollback para `USE_FIFO_MOVEMENTS_ENGINE=0`.

Resultado resumido:

- Checklist de QA: pronto e detalhado.
- Validador read-only: pronto para uso com `--account-id`, `--purchase-id` e `--entry-id`.
- Flag: instruções documentadas apenas para staging.

Pendências:

- Aguardar o operador ativar a flag em staging e executar a compra de teste.
- Depois da compra, rodar o validador read-only com os identificadores coletados.

Notas de segurança:

- Nenhuma seed foi executada.
- Nenhum deploy foi realizado.
- Nenhuma mudança em produção foi permitida.

## 2026-05-20 — 1.3.23 preflight (tentativa)

Objetivo:

- Executar preflight seguro em `STAGING_DATABASE_URL` e `TEST_DATABASE_URL` para validar identidade dos bancos antes de aplicar migrations.

Resultado da execução (resumido e mascarado):

- `preflight` em `staging` e `test` foram executados, mas falharam ao tentar interpretar a string de conexão presente nas variáveis de ambiente (`ERR_INVALID_URL`).
- A falha indica que o valor de `STAGING_DATABASE_URL` / `TEST_DATABASE_URL` definido localmente não está no formato esperado por `pg`/URL ou contém caracteres inesperados.

Ação recomendada:

- Verificar o formato das variáveis `STAGING_DATABASE_URL` e `TEST_DATABASE_URL` no host/secret store (deve ser um URL Postgres válido: `postgres://user:pass@host:port/dbname`).
- Corrigir o formato e re-executar `npm run db:preflight:staging` e `npm run db:preflight:test`.
- Não prosseguir para aplicar qualquer migration até que o preflight retorne `current_database()` correspondente ao DB esperado e backups/snapshots estejam confirmados.

## 2026-05-20 — 1.3.23 preflight (validação bem-sucedida)

Resultado (mascarado):

- `staging` — host: `72.60.143.***`, database: `staging_db`, user: `p***s`, conexão: `OK`, `current_database()`: `staging_db`, `current_user()`: `postgres`, versão: `PostgreSQL 17.6 (...)`, public tables (sample): `[]`.
- `test` — host: `72.60.143.***`, database: `test_db`, user: `p***s`, conexão: `OK`, `current_database()`: `test_db`, `current_user()`: `postgres`, versão: `PostgreSQL 17.6 (...)`, public tables (sample): `[]`.

Conclusão: ambos os bancos isolados de staging e test responderam corretamente ao preflight e aparentam ser bases distintas e não-produtivas; nenhuma escrita, migration ou seed foi executada nesta validação.

## 2026-05-20 — 1.3.24 tentativa de aplicação em staging (bloqueada)

Resumo: tentativa de aplicar `db/app/migrations/0001_add_mile_point_lots.sql` em `staging_db` falhou.

Erro mascarado registrado:

- `Migration failed: relation "public.mile_entries" does not exist` — indica que a migration assume a existência de tabelas auxiliares (`mile_entries`, `mile_transfers`, `program_accounts`) que não existem no banco staging atual.

Ação recomendada:

- Executar migrations base/anteriores que criam `mile_entries`, `program_accounts` e demais dependências antes de aplicar esta migration, ou ajustar a migration para ser aplicável em um banco vazio (incluir guards que criem/ignore indexes e constraints somente quando as tabelas existirem).
- Como alternativa, provisionar staging com esquema base ou executar `db:app:migrate` com cautela (preferir revisão/coordenação com DBA).

Decisão tomada nesta tentativa: **não aplicar** correções automáticas; a operação foi abortada e registros foram mantidos para investigação e ação subsequente.

2026-05-20 — 1.3.24.1: preparação de scripts de schema base

- Adicionados scripts de aplicação/validação para staging: `scripts/apply-staging-base-migrations.ts`, `scripts/validate-staging-base-schema.ts`, `scripts/validate-staging-ledger-migration.ts`.
- Scripts adicionados apenas à branch `1.3.24.1-staging-base-schema` e **não executados** durante esta etapa.

Objetivo:

- Integrar a mutation de compra/aquisição ao motor FIFO de forma atômica sob controle da feature flag `USE_FIFO_MOVEMENTS_ENGINE`.

Principais mudanças:

- `lib/repositories/movements.drizzle-repo.ts`: adicionada função `createDrizzleMovementsRepoFromClient(client)` que cria um repo Drizzle usando o `pg` client corrente.
- `app/app/purchases/actions.ts`: atualização para delegar ao `acquireMilesUseCase(..., txRepo)` quando a flag estiver ativa, executando o use-case dentro da mesma transação da compra.

Validações realizadas (local):

- `npm run test` — OK (29 tests passed | 3 skipped)
- `npm run typecheck` — OK
- `npm run lint` — OK (aviso não bloqueante em `lib/featureFlags.ts`)
- `npm run build` — OK

Observações:

- A migration `db/app/migrations/0001_add_mile_point_lots.sql` permanece proposta e NÃO APLICADA; validar em staging antes de ativar a flag.

## 2026-05-18 — Testes unitários da compra com flag e rollback simulado (1.3.21)

Objetivo:

- Garantir que a mutation de aquisição (`createPurchaseAction`) está protegida por testes unitários que cobrem o fluxo legado, a integração atômica com o motor FIFO sob feature flag e o comportamento de rollback quando o use-case falha.

Arquivos criados/alterados nesta etapa:

- `app/app/purchases/__tests__/actions.purchase.test.ts` — novos testes unitários cobrindo: flag off (fluxo legado), flag on (integração com `acquireMilesUseCase`) e flag on com falha (rollback simulado).
- `app/app/purchases/actions.ts` — refatorado para suportar injeção de `deps` (pool clients, `isFifoMovementsEngineEnabled`, `acquireMilesUseCase`, `revalidatePath`) para aumentar testabilidade.
- `lib/featureFlags.ts` — pequena correção para lint/exports.

Resumo técnico:

- A feature flag `USE_FIFO_MOVEMENTS_ENGINE` continua desligada por padrão. Quando ligada, `createPurchaseAction` cria um repo Drizzle usando o `pg` client corrente (`createDrizzleMovementsRepoFromClient`) e chama `acquireMilesUseCase` dentro da mesma transação antes do `COMMIT`.
- Nos testes unitários a atomicidade e rollback são simulados: o `acquireMilesUseCase` é mockado para lançar erro e valida-se que a ação faz `ROLLBACK` e que `COMMIT` não é executado.

Testes adicionados:

- `app/app/purchases/__tests__/actions.purchase.test.ts` — 3 cenários unitários (flag off, flag on, flag on + falha).

Decisões:

- Manter a flag desligada por padrão até validação em staging.
- Testes unitários simulam rollback; rollback real deve ser verificado em ambiente isolado com DB real.

Riscos:

- A validação do rollback real depende de um ambiente de DB isolado e da aplicação da migration `0001_add_mile_point_lots.sql` em staging.

Pendências:

- Provisionar staging isolado; aplicar migration e rodar testes de integração.
- Validar operações de rollback reais contra o APP DB isolado.

Validações executadas (local):

- `npm run test` — OK (todos os testes unitários passaram localmente)
- `npm run typecheck` — OK
- `npm run lint` — OK
- `npm run build` — OK

## 2026-05-16 — Execução de seed idempotente (operacional)

Objetivo:

- Executar o seed idempotente do VisioMilhas em ambiente local e validar que não há duplicação ao rodar múltiplas vezes.

Ações executadas:

- `npm run db:check-env` — ALL_PRESENT
- `npm run db:check-connections` — ADM e APP conectam (databases: controle_adm_saas_datavisio, visiomilhas_app)
- `npm run db:seed:verify` (antes do seed) — todas as tabelas listadas retornaram 0 registros
- `npm run db:seed` — executado com autorização explícita; rodado duas vezes para validar idempotência
- `npm run db:seed:verify` (após seed) — contagens confirmadas; terceira execução de verificação confirmou idempotência

Contagens (sanitizadas):

- Antes do seed: todas as tabelas listadas retornaram 0 registros.
- Após primeira execução (parcial): ADM populado — `plans: 3, organizations:1, global_users:1, organization_memberships:1, subscriptions:1` (APP ainda 0).
- Após segunda execução (completa):
  - ADM: `plans: 3, organizations:1, global_users:1, organization_memberships:1, subscriptions:1`
  - APP: `loyalty_programs: 5, program_accounts: 3, mile_entries:1, mile_purchases:1, mile_sales:1, mile_transfers:1, mile_clubs:3, beneficiaries:0, business_contacts:0`

Observações:

- A primeira execução gravou apenas dados ADM (a segunda execução completou a inserção APP). Após a terceira execução as contagens permaneceram iguais, confirmando idempotência do runner.
- Nenhum segredo foi impresso; `.env` permaneceu não versionado.

Próximo passo recomendado: conectar as rotas e telas principais ao banco real e validar fluxos de UI/UX com dados demo.

Riscos / observações:

- As migrations representam apenas a modelagem inicial; revisar constraints/fks/índices adicionais conforme necessidades de performance e integridade.
- Não foram realizadas operações destrutivas; se alguma tabela já existisse seria preservada.

Versionamento operacional

- Regra adotada: `MVP.Funcionalidade.Commit` (ex.: `1.1.7`).
- MVP atual: `1` (MVP1).
- Etapa/Funcionalidade atual: `1.1` — Fundação técnica, banco, migrations e seed inicial.
- Versão operacional atual: `1.1.6`. Próxima incremental: `1.1.7`.

## 2026-05-16 — Conexão do dashboard ao banco (1.2.1)

Objetivo:

- Conectar o dashboard e telas iniciais ao banco real (APP) e validar build/checagens.

O que foi feito:

- Implementado `lib/server/dashboard.ts` com consultas server-side para métricas, lançamentos e compras.
- Atualizada a página do dashboard `app/app/dashboard/page.tsx` para buscar dados em runtime (Server Component) e marcada como dinâmica.
- Corrigido warning ESLint (`import/no-anonymous-default-export`) em `lib/server/dashboard.ts`.
- Rodadas validações: `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build` — todas passaram (build exigiu `force-dynamic` para evitar queries em tempo de build).

Comandos executados:

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

Resultado:

- Todas as validações passaram. Build final passou após tornar a página dinâmica para evitar queries durante prerender.

Pendências:

- Conectar `/app/programs`, `/app/accounts`, `/app/entries` ao banco real.
- Criar formulários reais e rotas de CRUD.
- Revisar FKs/índices e autenticação.

Versão operacional agora: `1.2.1` (MVP1, funcionalidade 1.2, commit 1)

## 2026-05-16 — Conexão dos programas ao banco (1.2.2)

Objetivo:

- Conectar a página de `Programas` (`/app/programs`) ao banco APP e exibir programas reais.

O que foi feito:

- Implementado `lib/data/programs.ts` com função `getProgramsOverview` que consulta `loyalty_programs` no APP DB.
- Atualizada a página `app/app/programs/page.tsx` para buscar dados no servidor (Server Component) e marcada como dinâmica.
- Atualizado `README.md` e docs operacionais com versão `1.2.2`.

Comandos executados:

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

Resultado:

- Todos os checks passaram. A página de programas agora busca dados reais do APP DB em runtime.

Pendências:

- Conectar `/app/accounts`, `/app/entries` e criar CRUDs e autenticação.

Versão operacional agora: `1.2.2` (MVP1, funcionalidade 1.2, commit 2)

## 2026-05-16 — Conexão das contas ao banco (1.2.3)

Objetivo:

- Conectar a página de `Contas` (`/app/accounts`) ao APP DB e exibir contas reais.

O que foi feito:

- Implementado `lib/data/accounts.ts` com função `getAccountsOverview` que consulta `program_accounts` (e junta `loyalty_programs` para nome do programa).
- Atualizada a página `app/app/accounts/page.tsx` para buscar dados no servidor (Server Component), marcada como dinâmica e com empty state.
- Atualizado `README.md` e docs operacionais com versão `1.2.3`.

Comandos executados:

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

Resultado:

- Todos os checks passaram. A página de contas agora busca dados reais do APP DB em runtime.

Pendências:

- Conectar `/app/entries` e criar CRUDs e autenticação.

Versão operacional agora: `1.2.3` (MVP1, funcionalidade 1.2, commit 3)

## 2026-05-16 — Conexão do extrato ao banco (1.2.4)

Objetivo:

- Conectar `/app/entries` (extrato) ao APP DB e exibir lançamentos reais.

O que foi feito:

- Implementado `lib/data/entries.ts` com função `getEntriesOverview` que consulta `mile_entries` e junta `loyalty_programs` e `program_accounts`.
- Atualizada a página `app/app/entries/page.tsx` para buscar dados no servidor (Server Component), marcada como dinâmica e com empty state.
- Atualizado `README.md` e docs operacionais com versão `1.2.4`.

Comandos executados:

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

Resultado:

- Todos os checks passaram. A página de extrato agora busca dados reais do APP DB em runtime.

Pendências:

- Conectar compras/vendas/transferências e consolidar fluxo de extrato, se necessário.

Versão operacional agora: `1.2.4` (MVP1, funcionalidade 1.2, commit 4)

## 2026-05-17 — Conexão de compras, vendas e transferências ao banco (1.2.5)

Objetivo:

- Conectar `/app/purchases`, `/app/sales` e `/app/transfers` ao APP DB e expor visões read-only em runtime.

O que foi feito:

- Implementado `lib/data/purchases.ts` com `getPurchasesOverview` consultando `mile_purchases` e juntando `loyalty_programs` e `program_accounts`.
- Implementado `lib/data/sales.ts` com `getSalesOverview` consultando `mile_sales` e juntando `loyalty_programs` e `program_accounts`.
- Implementado `lib/data/transfers.ts` com `getTransfersOverview` consultando `mile_transfers` e juntando programas/contas de origem e destino.
- Atualizadas as páginas: `app/app/purchases/page.tsx`, `app/app/sales/page.tsx`, `app/app/transfers/page.tsx` para Server Components dinâmicos (`force-dynamic`) usando as funções acima e com empty states.
- Atualizado `README.md` para versão operacional `1.2.5`.

Comandos executados:

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

Resultado:

- Checks locais passam (tests, typecheck, lint). Páginas marcadas como dinâmicas para evitar consultas em build-time.

Pendências:

- Implementar CRUD e fluxos de criação/edição/aprovação para compras/vendas/transferências (próximo ciclo).
- Autenticação/autorizações para operações sensíveis.

Versão operacional agora: `1.2.5` (MVP1, funcionalidade 1.2, commit 5)

## 2026-05-20 — 1.3.25.1 — ampliação dos testes de integração MovementsRepo (test_db)

Resumo:

- Implementados e validados localmente testes de integração contra `TEST_DATABASE_URL` cobrindo:
  - rollback transacional real;
  - consumo FIFO por lotes;
  - transferência entre contas;
  - limpeza/cleanup seguro ao final dos testes.

Resultados:

- `npm run test:integration` (contra `TEST_DATABASE_URL`) — OK (5/5 tests);
- `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build` — OK;
- Nenhuma alteração em staging ou execução de seeds;
- Feature flag `USE_FIFO_MOVEMENTS_ENGINE` permanece OFF.

Observações operacionais:

- Branch criada localmente: `1.3.25.1-integration-tests-rollback-transfer`;
- Não foram expostas URLs nem secrets nos registros.

Próximo passo recomendado: coletar evidências sanitizadas e integrar regressão em CI apontando para DB de teste isolado.

## 2026-05-17 — Estabilização de leituras e separação ADM/APP (1.2.6)

Objetivo:

O que foi feito:

Validações e resultados:

Decisões e observações:

Versão operacional agora: `1.2.6` (MVP1, funcionalidade 1.2, commit 6)

## 2026-05-17 — Fechamento leituras e clubes (1.2.8)

Objetivo:

- Corrigir warning de lint, conectar `/app/clubs` ao APP DB e revisar `/app/settings`.

O que foi feito:

- Corrigido `lib/data/db-errors.ts` removendo export default anônimo para atender ESLint.
- Implementado `lib/data/clubs.ts` com `getClubsOverview` resolvendo `organizations` via ADM e lendo `mile_clubs` via APP.

## 2026-05-18 — Início 1.3.15 (preparação de persistência do motor FIFO)

Objetivo:

- Alinhar o `db/app/schema.ts` com a migration proposta `0001_add_mile_point_lots.sql` e preparar os tipos/contratos (`MovementsRepo`) para implementação concreta usando Drizzle e transações.

Notas:

- Esta etapa altera apenas a tipagem TypeScript e a documentação, mantendo a migration SQL como proposta. Nenhuma migration será aplicada e nenhum seed será executado durante esta etapa.

## 2026-05-18 — Implementação 1.3.16 (MovementsRepo Drizzle)

Objetivo:

- Implementar um repositório concreto `MovementsRepo` usando Drizzle para operações de ledger/lotes. Essa implementação provê métodos de leitura/escrita e um helper transacional para operações atômicas.

Notas:

- A implementação vive em `lib/repositories/movements.drizzle-repo.ts` e mantém `lib/services/movements.ts` desacoplado (injeção de dependência). Nenhuma migration foi aplicada e nenhum seed foi executado.
- Atualizada a página `app/app/clubs/page.tsx` para Server Component dinâmico (`force-dynamic`) e empty state seguro.
- Revisada `app/app/settings/page.tsx` para indicar que a persistência ainda não está implementada.
- Atualizado `README.md` para versão `1.2.8`.

Validações e resultados:

- `npm run db:check-env` → ALL_PRESENT
- `npm run db:check-connections` → ADM & APP OK
- `npm run db:check-tables` → todas as tabelas listadas retornaram OK (inclui `mile_clubs`)
- `npm run test`, `npm run typecheck`, `npm run lint` e `npm run build` passaram (lint sem warnings após correção)

Decisões:

- Manter fallback que retorna lista vazia somente para desenvolvimento quando a tabela estiver ausente (`42P01`), e remover esse fallback em produção.

Versão operacional agora: `1.2.8` (MVP1, funcionalidade 1.2, commit 7)

## 2026-05-18 — Integração UI CRUD operacional (1.3.10)

Objetivo:

- Integrar formulários de criação para compras, vendas e transferências nas páginas existentes e reutilizar Server Actions e validações Zod.

Arquivos criados/alterados nesta etapa:

- `components/forms/purchase-form.tsx`
- `components/forms/sale-form.tsx`
- `components/forms/transfer-form.tsx`
- `app/api/purchases/route.ts`
- `app/api/sales/route.ts`
- `app/api/transfers/route.ts`
- `app/app/purchases/page.tsx` (integração do formulário)
- `app/app/sales/page.tsx` (integração do formulário)
- `app/app/transfers/page.tsx` (integração do formulário)
- `README.md` (versão operacional 1.3.10)

Resumo técnico:

- Formulários implementados como Client Components que enviam `FormData` para endpoints API dedicados.
- Endpoints API reutilizam as Server Actions (`createPurchaseAction`, `createSaleAction`, `createTransferAction`) para manter a lógica transacional e validações Zod.
- Após criação, as Server Actions fazem `revalidatePath` nas rotas relevantes.

Decisões:

- Reutilizar Server Actions ao invés de duplicar lógica no handler API para manter única fonte de verdade.

Pendências:

- Testes manuais locais e ajustes UX; validação de regras de saldo em casos limites.

Versão operacional agora: `1.3.10` (MVP1, funcionalidade 1.3, commit local)

## 2026-05-18 — Pausa e reavaliação arquitetural (1.3.11)

Resumo:

Próximos passos (documentação/plano 1.3.11):

1. Mapear campos relevantes em `db/app/schema.ts` e produzir especificação de `mile_point_lots` proposta.
2. Desenhar motor FIFO: criação de lotes na compra, consumo por venda/transferência, cálculo de cost-basis por lote, registro de entradas de reversão e evidenciação de custos por `mile_sales`.
3. Planejamento incremental: 1.3.12 (migrations & revisão), 1.3.13 (motor FIFO + testes), 1.3.14 (refatorar Server Actions → services), 1.3.15 (UI reintegração), 1.3.16 (estabilidade e PR).
4. Documentar a dívida técnica e o racional da pausa em `DECISIONS.md` e `TODO_AI.md`.

Observação: nenhuma alteração de schema será aplicada nesta etapa sem aprovação; este passo é apenas de análise e planejamento.

## 2026-05-18 — Preparação do schema para ledger/FIFO (1.3.12)

Objetivo:

- Preparar o schema APP para persistência de lotes (`mile_point_lots`) e dar suporte a consumo FIFO sem aplicar migrations.

O que foi feito:

- Atualizado `db/app/schema.ts` incluindo `mile_point_lots` (Drizzle) e colunas auxiliares em `mile_entries` e `mile_transfers`.
- Migration SQL proposta criada em `db/app/migrations/0001_add_mile_point_lots.sql` — NÃO APLICADA.
- Atualizado README para versão operacional `1.3.12` e adicionado `docs/ai-context/IMPLEMENTATION_PLAN.md` com roadmap para 1.3.13.

Decisões:

- Mantida compatibilidade com tabelas existentes; não renomear ou apagar tables.
- Não aplicar migrations nesta etapa; gerar artifacts para revisão e commit local.

Próximos passos:

- 1.3.13 foi dividido em duas fases:
  - 1.3.13 — Refinamento de migration e constraints (FKs, índices, checks) — concluído nesta etapa com migration proposta refinada.
  - 1.3.14 — Implementar `lib/services/movements.ts` (motor FIFO) e testes unitários.

  ## 2026-05-18 — Consolidação do motor FIFO puro (1.3.14)

  Resumo:
  - Objetivo: consolidar o motor FIFO puro/in-memory para validação de regras de domínio sem integração com persistência real.
  - Arquivos alterados: `lib/services/movements.ts`, `lib/services/__tests__/movements.test.ts`, `docs/ai-context/manual-tests-1.3.14.md`.
  - Validações executadas: `npm run test` (22/22 OK), `npm run typecheck` (OK), `npm run lint` (OK), `npm run build` (OK).
  - Observação: migration `db/app/migrations/0001_add_mile_point_lots.sql` permanece proposta e NÃO APLICADA.

  ## 2026-05-20 — 1.3.24.2 — schema base e ledger aplicados e validados em staging

  Resumo:
  - Branch criada: `1.3.24.2-apply-base-and-ledger-staging` (local).
  - Preflight (`npm run db:preflight:staging`) executado e confirmou `current_database() = staging_db` (mascarado).
  - `npm run db:migrate:staging:base` aplicado: `db/app/migrations/0000_misty_kulan_gath.sql` — aplicado com sucesso em transação.
  - `npm run db:validate:staging:base` validou existência de `program_accounts`, `mile_entries`, `mile_transfers` e colunas principais.
  - `npm run db:migrate:staging:ledger` aplicado: `db/app/migrations/0001_add_mile_point_lots.sql` — aplicado com sucesso.
  - `npm run db:validate:staging:ledger` validou `mile_point_lots`, `mile_transfers` e índices principais esperados.

  Notas de segurança:
  - Não foram expostos secrets ou URLs completas nos registros.
  - Nenhum seed foi executado.
  - `npm run test:integration` NÃO foi executado como parte desta operação.

  Pendências / recomendações:
  - Manter snapshot/backup do staging e validar testes de integração em ambiente isolado antes de ativar `USE_FIFO_MOVEMENTS_ENGINE`.
  - Registrar evidências de QA e testes de integração antes de considerar rollout controlado.

  ## 2026-05-20 — 1.3.25 — testes de integração MovementsRepo contra test_db

  Resumo:
  - Branch criada: `1.3.25-integration-tests-movements-test-db` (local).
  - Scripts criados em `scripts/` para preparar/validar `test_db` usando `TEST_DATABASE_URL`.
  - `db:migrate:test:base` aplicado com sucesso (`0000_misty_kulan_gath.sql`).
  - `db:validate:test:base` confirmou `program_accounts`, `mile_entries`, `mile_transfers`.
  - `db:migrate:test:ledger` aplicado com sucesso (`0001_add_mile_point_lots.sql`).
  - `db:validate:test:ledger` confirmou `mile_point_lots`, `mile_transfers` e índices principais.
  - `npm run test:integration` rodou contra `test_db` e passou (cenários básicos implementados).

  Notas de segurança:
  - Nenhuma alteração em `staging` foi feita nesta etapa.
  - Nenhum secret ou URL completo foi registrado.

  Próximo passo:
  - Expandir cenários de integração (rollback transacional, transfers) e coletar evidências de QA antes de ativar flags.

## 2026-05-20 — 1.3.25.2 — preparar CI para testes de integração MovementsRepo (test_db)

Objetivo:

- Criar um workflow CI seguro para rodar os testes de integração do `MovementsRepo` apontando exclusivamente para `TEST_DATABASE_URL` (banco de teste isolado/descartável).

O que foi implementado:

- Adicionado workflow GitHub Actions: `.github/workflows/integration-tests.yml` (manual via `workflow_dispatch`).
- O workflow valida a presença de `TEST_DATABASE_URL`, executa `npm run db:preflight:test`, aplica e valida esquemas (`db:migrate:test:*`, `db:validate:test:*`) e executa `npm run test:integration`.

Validações locais (2026-05-20):

- `npm run test` (unit + integração local): OK (observação: `test:integration` não foi executado isoladamente porque `TEST_DATABASE_URL` não está configurado no ambiente deste agente). Os testes unitários e checks relacionados passaram localmente.
- `npm run typecheck`: OK
- `npm run lint`: OK
- `npm run build`: OK

Observação: a execução completa de `npm run test:integration` e dos scripts de preflight/migrate/test depende da configuração local de `TEST_DATABASE_URL` (secret). Próximo passo: configurar `TEST_DATABASE_URL` como secret no repositório e executar o workflow manualmente no GitHub Actions.

Segurança:

- `USE_FIFO_MOVEMENTS_ENGINE` definido como `0` no workflow; o job não usa `DATABASE_URL` nem `STAGING_DATABASE_URL`.
- O workflow depende do secret `TEST_DATABASE_URL` (não registrado aqui nem em logs).

Próximo passo recomendado:

1. Configurar `TEST_DATABASE_URL` como secret no repositório do GitHub apontando para um DB de teste isolado e descartável.
2. Rodar o workflow manualmente e coletar artefatos sanitizados se passar.

## 2026-05-20 — 1.3.25.3 — execução manual segura do workflow CI

Objetivo:

- Fornecer instruções passo a passo para um operador humano configurar o secret `TEST_DATABASE_URL` no GitHub e executar o workflow `Integration Tests - MovementsRepo` sem expor segredos.

Instruções resumidas para o operador:

- No GitHub do repositório: Settings → Secrets and variables → Actions → New repository secret.
  - Nome: `TEST_DATABASE_URL`
  - Valor: URL segura do banco de teste (ex.: `postgres://user:pass@host:port/test_db`) — **não** gravar este valor nos arquivos do repositório.
- Em Actions, selecionar `Integration Tests - MovementsRepo` e clicar em `Run workflow`. Selecionar a branch `1.3.25.3-ci-manual-run-instructions` (ou `1.3.25.2-ci-integration-tests-test-db`) e executar.
- Conferir logs sanitizados e confirmar que os passos passaram: `db:preflight:test`, `db:migrate:test:base`, `db:validate:test:base`, `db:migrate:test:ledger`, `db:validate:test:ledger`, `test:integration`.

Notas de segurança:

- O workflow faz masking do connection string e não imprime segredos (scripts usam masking). Ainda assim, nunca cole o valor do secret em conversas públicas ou documentos versionados.
- Este agente NÃO configura o secret automaticamente; solicite ao responsável de infraestrutura/owner para adicionar o secret.
- Se houver falha, coletar apenas logs sanitizados e abrir investigação; não executar ações manuais em `staging` ou `production`.
