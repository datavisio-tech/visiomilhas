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
- Rodar lint/typecheck/build após scaffold.
