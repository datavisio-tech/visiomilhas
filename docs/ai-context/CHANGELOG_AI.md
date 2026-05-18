# CHANGELOG_AI

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
