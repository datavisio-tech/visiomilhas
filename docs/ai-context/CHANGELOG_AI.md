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
