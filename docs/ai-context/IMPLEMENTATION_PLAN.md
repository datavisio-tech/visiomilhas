# IMPLEMENTATION_PLAN - MVP1 (VisioMilhas)

Fase 2.2-F: Transitional Surface Cleanup

- Evitar middleware global, RBAC, ACL, permission framework, auth rewrite e big bang migration.

Fase 2.2-G: Transitional Finalization & Recovery-Only Fallback

- Tornar o fallback recovery-only explícito no boundary de leitura e manter o runtime normal hardened.
- Consolidar Better Auth nas últimas superfícies de leitura estáveis.
- Monitorar hotspots e fallback near-zero com `auth-observability.ts` e a matriz operacional.
- Classificar superfícies como transitional, stabilized e hardened com base em uso real.
- Preservar o fake adapter para dev/test/recovery, sem permitir uso silencioso em runtime normal.
- Evitar middleware global, RBAC, ACL, permission framework, auth rewrite e big bang migration.

Fase 2.2-I: AI Knowledge & Skill Consolidation

- Consolidar a hierarquia oficial entre docs, specs, skills e agents sem criar arquitetura paralela em `.claude`.
- Atualizar o operating model para deixar claro o que pertence a contexto, contrato, especializacao operacional e orchestration.
- Sincronizar skills e agents com as specs oficiais quando houver sobreposicao de responsabilidade.
- Detectar drift por duplicacao, conflito ou regra antiga que contradiz o boundary oficial.
- Evitar framework de agentes, orchestration engine ou runtime IA.

Fase 2.2-J: AI Governance Versioning

- Consolidar `AI_OPERATING_MODEL_VERSION=2.2-I` como baseline oficial ativa.
- Versionar skills e agents com metadados simples de compatibilidade e status operacional.
- Criar matriz de compatibilidade entre operating model, skills, agents e governança de auth/recovery/ownership.
- Documentar regras de drift e quando bump de versão é obrigatório.
- Evitar semver complexo, compatibilidade automática ou tooling pesado.
## 1.3.34.3 — reindex do workflow manual por novo filename

- O workflow manual de produção foi renomeado para `production-deploy-manual.yml`.
- O nome amigável passou a ser `Production Deploy Manual - VisioMilhas`.
- A motivação foi forçar nova indexação no GitHub Actions após o 422 persistente com o filename anterior.
- Próximo passo: publicar em PR/merge e reavaliar o dispatch manual somente depois disso.

## 1.3.34.1 — proteção textual do workflow de produção

- O workflow manual de produção recebeu inputs explícitos em `workflow_dispatch`.
- A confirmação textual `DEPLOY` passou a ser exigida logo após o checkout, antes de qualquer SSH/sync.
- A estratégia de tag atual foi preservada para evitar complexidade desnecessária.
- Próximo passo: publicar a correção em PR e somente depois considerar o primeiro dispatch controlado.

## 2.3-C — Initial User Onboarding Flow

- Implementar `/onboarding` com server action para provisionamento idempotente de organização pessoal (adm DB) e recursos iniciais no app DB (program + account).
- Integrar provisionamento não-blocking na resolução de sessão e redirecionamentos server-side quando usuário autenticado não possui organização.
- Não aplicar migrations nem alterar infra; tudo deve usar tabelas existentes e ser idempotente.

## 2.3-D — Onboarding Telemetry & Auth Flow Stabilization

- Instrumentar `auth-observability` com eventos mínimos de onboarding (`started`, `completed`, `failed`).
- Consolidar UX operacional de onboarding com loading, erro amigável e retry seguro.
- Reduzir risco operacional: guards simples, deduplicação incremental e validações server-side.
- Preparar staging real documentando readiness onboarding/auth/OAuth/observability/deploy sem alterar infraestrutura.

## 2.3-E — Staging Validation & OAuth Runtime Hardening

- Validar staging real com Google OAuth, callback, logout, refresh e retry onboarding.
- Reduzir duplicidade e race conditions por guards incrementais e slug determinístico por usuário.
- Expandir observabilidade de auth/onboarding para callback failures, redirect loops e recovery flows.
- Classificar readiness em stable, transitional e recovery-only antes do primeiro rollout controlado.

## 2.3-G — First Real Staging Validation & OAuth Operational Audit

- Validar staging real com Google OAuth, callback, sessão, logout, refresh e retry onboarding sem regressão.
- Auditar runtime OAuth com metadata operacional expandida (`runtimeState`, `retryState`, `recoveryState`, `flowStage`, `environmentTag`).
- Consolidar checklist pré-deploy controlado para primeiros usuários de teste.
- Não alterar infraestrutura, deploy, middleware, billing ou arquitetura nova.

## 2.4-A — Controlled Real Staging Rollout

- Executar rollout controlado real com usuário de teste, validando Google OAuth, callback, sessão, logout, refresh e onboarding.
- Observar runtime OAuth com browser context, environment tag, retry/recovery state e duplicate prevention.
- Consolidar checklist do primeiro deploy controlado e observar hotspots antes de ampliar acesso.
- Evitar qualquer mudança estrutural em deploy, infraestrutura, middleware ou auth rewrite.

## 2.4-B — Real Interface Validation & Browser Runtime Audit

- Validar visualmente home, sign-in, callback, dashboard, onboarding, logout e reload no navegador.
- Corrigir apenas o que quebrar a navegação browser-first, com loading/error states explícitos.
- Manter Better Auth dominante e o fallback recovery-only preservado.
- Evitar redesign, middleware global, infraestrutura, RBAC e mudanças de contrato além da entrada pública de sign-in.

## 2.4-D — Better Auth Bootstrap Guard & Operational Recovery

- Implementar guard mínimo em `lib/auth.ts` para capturar falhas de bootstrap sem lançar durante import.
- Ajustar `app/api/auth/[...all]/route.ts` para responder JSON 503 controlado quando o auth estiver indisponivel.
- Expandir `lib/server/auth-observability.ts` com códigos de evento: `AUTH_BOOTSTRAP_FAILED`, `AUTH_ENV_INVALID`, `OAUTH_RUNTIME_ERROR`.
- Validar browser flows localmente e em staging após provisionar variaveis de ambiente.

Critérios de aceite:

- Runtime não gera mais 500 vazio.
- Falhas de bootstrap viram estado operacional explícito e evento de telemetria.
- Better Auth continua dominante quando envs corretos estiverem presentes.

## 2.4-E — Better Auth Drizzle Adapter Runtime Fix

- Implementar schema mínimo para o adapter Drizzle e anexá-lo ao cliente admin.
- Validar que o adapter não lança `model "verification" not found`.
- Passar schema explicitamente ao `drizzleAdapter` como medida redundante.
- Executar validação ponta-a-ponta de OAuth em staging real após migrations.

## 2.4-F — Better Auth Database Provisioning & OAuth Persistence

- Criar migration ADM para tabelas `ba_users`, `ba_sessions`, `ba_accounts`, `ba_verification`.
- Aplicar migration em staging e validar persistência real do OAuth.
- Confirmar login, callback, logout, refresh e reopen no browser sem loops.
- Ajustar Google Console se necessário evitar `redirect_uri_mismatch`.

## 2.4-H — Session 3 — Better Auth Drizzle Schema Alignment

- Alinhar o schema lógico exportado para Better Auth com os nomes esperados pelo adapter: `user`, `session`, `account`, `verification`.
- Preservar as tabelas físicas existentes (`ba_users`, `ba_sessions`, `ba_accounts`, `ba_verification`) sem alterar migration, ownership ou arquitetura.
- Consumir o namespace do schema diretamente em `lib/auth.ts` e manter compatibilidade no client Drizzle administrativo.
- Revalidar lint, typecheck, testes e diff-check após o ajuste.
- Tentar novamente o fluxo OAuth real apenas se houver credencial Google válida disponível; caso contrário, registrar o bloqueio externo sem mascarar o estado do runtime.

## 2.4-G — Real Google OAuth Staging Stabilization & Observability Expansion

Objetivo: Resolver bloqueador de OAuth e estabilizar callback ponta-a-ponta.

Status: ✅ Parcialmente Completo (bloqueador identificado, em espera de Google Console update)

Itens Concluídos:

- ✅ Database: Confirmado 4 tabelas Better Auth em ADM
- ✅ Runtime: Callback URI gerado corretamente (`http://localhost:3000/api/auth/callback/google`)
- ✅ Observabilidade: 3 novos event codes (OAUTH_REDIRECT_URI_MISMATCH, OAUTH_CALLBACK_SUCCESS, SESSION_PERSISTENCE_CONFIRMED)
- ✅ Error Detection: Melhorada detecção de `redirect_uri_mismatch` na rota
- ✅ Environment Tracking: Todos eventos rastreiam environment tag e timestamp

Bloqueador Identificado:

Google Cloud Console não tem URIs localhost registradas. Necessário adicionar:

```
Authorized redirect URIs:
- http://localhost:3000/api/auth/callback/google
- http://localhost:3001/api/auth/callback/google

Authorized JavaScript origins:
- http://localhost:3000
- http://localhost:3001
```

Próxima Etapa:

1. Atualizar Google Cloud Console com URIs localhost
2. Testar fluxo OAuth completo no navegador
3. Validar persistência em ba_sessions
4. Fazer commit final com sucesso OAuth real
5. Avançar para staging real com usuário de teste

Critérios de aceite 2.4-G:

- [ ] Google Console URIs atualizadas
- [ ] Fluxo OAuth completo funcional (login → callback → onboarding → dashboard)
- [ ] Logout funcional
- [ ] Refresh funcional
- [ ] Reopen browser mantém sessão
- [ ] ba_sessions com dados reais
- [ ] ba_users com dados reais
- [ ] Sem 500 errors
- [ ] Observabilidade rastreando eventos corretos

- Adicionar mapeamento mínimo do schema esperado pelo adapter (`users`, `sessions`, `accounts`, `verification`) sem alterar o domínio.
- Anexar o schema ao cliente Drizzle admin (`drizzle(pool, { schema })`) e passar o schema explicitamente ao `drizzleAdapter`.
- Validar browser-first flows localmente e em staging após provisionar migrations/tabelas.

Critérios de aceite:

- Adapter Better Auth funcional sem erro de "model not found".
- OAuth Google funcionando com callback e persistência de sessão.

## 2.4-F — Better Auth Database Provisioning & OAuth Persistence

- Criar migration ADM com as tabelas do Better Auth (`ba_users`, `ba_sessions`, `ba_accounts`, `ba_verification`).
- Garantir que o schema runtime reflita os campos reais do Better Auth (ids string, tokens, timestamps, verification).
- Expandir observabilidade para eventos de tabela/migration/persistência.
- Validar login, callback, sessão persistida, logout, refresh e reopen em staging após aplicar migration.

Observação operacional:

- Se o OAuth falhar com `redirect_uri_mismatch`, ajustar os URIs de callback no Google Console antes de repetir a validação.

Critérios de aceite:

- Tabelas Better Auth provisionadas no ADM.
- OAuth Google funcional com persistência de sessão.

Atualização 1.3.14:

- Consolidação do motor FIFO puro/in-memory em `lib/services/movements.ts` com testes unitários em `lib/services/__tests__/movements.test.ts`.
- Status: 1.3.14 validado localmente (test/typecheck/lint/build OK). Persistência real (MovementsRepo Drizzle) adiada para 1.3.15.
- Próximo: 1.3.15 — alinhar schema↔migration, refinar `MovementsRepo` (tipos/contratos) e preparar implementação Drizzle com transações. Não aplicar migrations nesta etapa.
- Próximo: 1.3.16 — implementar `MovementsRepo` concreto usando Drizzle (transações) e preparar testes de integração em ambiente seguro. Não aplicar migrations nesta etapa de implementação.

Atualização 1.3.20:

- Objetivo: integrar a mutation de compra/aquisição ao motor FIFO de forma atômica quando a flag `USE_FIFO_MOVEMENTS_ENGINE` estiver ativa.
- Implementações: `createDrizzleMovementsRepoFromClient(client)` para criar um repo que reutiliza o `pg` client atual; `createPurchaseAction` delega ao `acquireMilesUseCase(..., txRepo)` antes do `COMMIT`.
- Observação: essa integração exige validar a migration `db/app/migrations/0001_add_mile_point_lots.sql` em staging antes de ativar a flag em ambiente de produção.
- Próximo: 1.3.17/1.3.18 — preparar testes de integração e integrar as mutations via camada de use-cases que orquestra `createMovementService` + `MovementsRepo` (Drizzle).

Status 1.3.20: concluído

Status 1.3.21: concluído — testes unitários para `createPurchaseAction` adicionados (flag off, flag on, rollback simulado).

Próxima etapa: 1.3.22 (não iniciar nesta tarefa) — preparar testes de integração em staging, validar migration e definir rollout.
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

Fase 0.5: stack IA-First operacional

- Consolidar docs/ai-context como fonte de verdade operacional
- Criar docs/specs com specs enxutas e versionadas
- Criar docs/ai-skills com skills reutilizaveis e controladas
- Definir padroes de prompt e fluxo de trabalho IA-First
- Registrar agentes especializados apenas onde houver ganho real

Fase 2.1-A: auth context + ownership contracts

- Definir AuthContext e OwnershipContext sem runtime de auth
- Consolidar boundaries obrigatórias para routes, actions, services e repositories
- Reduzir dependencia de organizationId como eixo de autorizacao
- Documentar strategy de Better Auth e Google OAuth sem instalar dependencias
- Preparar rollout incremental e rollback seguro

Fase 2.1-B: helpers reais de auth/ownership

- Implementar helpers internos para criar, resolver e exigir AuthContext e OwnershipContext
- Manter os helpers independentes de Better Auth
- Centralizar validação de ownership por userId e admin interno
- Preparar o terreno para um future adapter de auth, nao para a biblioteca em si

Fase 2.1-C: boundary integration sem provider

- Integrar os helpers nas mutações e rotas mais criticas
- Usar fake auth adapters controlados para simular boundary
- Proteger primeiro compras, vendas e transferencias
- Deixar dashboard, entries e accounts para a proxima leitura critica
- Manter middleware global fora do escopo desta fase
- Nao alterar schema nesta etapa

Fase 2.1-D: read enforcement

- Remover slug e params da entrada de leitura
- Passar sessionContext explicitamente para services de leitura
- Derivar organizationId no servidor
- Proteger dashboard, accounts, entries, purchases, sales e transfers na leitura
- Manter middleware global fora do escopo

Fase 1: auth, tenant e onboarding

- Implementar Better Auth com Google OAuth
- Middleware de proteção e checagem de ownership
- Sessão server-side e helpers de auth
- Criação automatizada de ownership/conta principal no onboarding
- Criar subscription trialing de 15 dias
- Manter organization_id apenas como compatibilidade arquitetural quando necessário
- Permissoes iniciais: usuario comum e admin interno

Fase 2.2: Better Auth foundation

- Criar a instância Better Auth com Drizzle e cookies seguros
- Expor o route handler App Router de auth
- Resolver sessão server-side por `auth.api.getSession`
- Mapear o payload externo para `SessionContext` sem alterar os helpers centrais
- Preservar fake-auth-adapter e read-scope até o rollout da sessão real estabilizar
- Preparar Google OAuth como primeiro provider

Fase 2.2-B: Controlled Session Migration

- Migrar `purchases`, `sales` e `transfers` para `resolveCurrentBetterAuthSessionContext()` via resolvedor controlado
- Manter fake-auth como fallback operacional e rollback rápido
- Adicionar logs mínimos para auth/session/ownership
- Cobrir o novo fluxo com testes de boundary e de fallback

Fase 2.2-C: Ownership Hardening

- Remover `orgSlug` dos contratos de escrita e derivar `organizationId` no servidor a partir da ownership resolvida.
- Validar origem e destino em transferências sob o mesmo escopo de ownership.
- Manter `controlled-session.ts` como entrada única para boundaries migradas.
- Reduzir a confiança em input de cliente sem espalhar middleware global.
- Preparar a redução gradual do fake adapter sem criar RBAC enterprise.

Fase 2.2-D: Better Auth Operational Consolidation

- Tornar Better Auth o caminho primário de sessão para os fluxos já migrados.
- Manter fake-auth-adapter como transitional para desenvolvimento local, testes e recovery controlado.
- Consolidar observabilidade de fallback com origem, motivo e timestamp por operação.
- Continuar a migração incremental das rotas restantes sem big bang.
- Documentar critérios futuros para remoção gradual do fallback quando a estabilidade for suficiente.

Fase 2.2-E: Fallback Reduction & Stabilization

- Medir uso real do fallback em produção e em ambientes controlados.
- Mover as rotas restantes uma por uma para o caminho controlado por Better Auth.
- Reduzir gradualmente os caminhos transitional conforme a observabilidade permitir.
- Manter rollback simples e explícito enquanto o fallback ainda for necessário.
- Preparar a retirada futura do fake adapter apenas após estabilidade sustentada.
- Expandir observabilidade com source, reason, firstSeen e lastSeen por superfície.
- Consolidar a matriz operacional com status de Better Auth, fallback usage, ownership status, rollout status e stabilization level.
- Considerar remoção futura apenas quando o fallback ficar near-zero e sem incidentes operacionais relevantes.
- Permanecer sem middleware global, RBAC, ACL, auth microservice ou reescrita ampla do domínio.

Fase 2.2-F: Transitional Surface Cleanup

Fase 2.3-A: SaaS B2C Onboarding Foundation

- Objetivo: preparar onboarding B2C mínimo com Google OAuth, sessão server-side persistente, criação automática de conta pessoal e proteção de rotas/Server Actions.
- Critérios: login Google funcional, sessão persistente, ownership derivada, onboarding mínimo funcionando, runtime hardened preservado.
- Itens de entrega iniciais:
  - Integração do fluxo de login via `Better Auth` (já presente em `lib/auth.ts` e `app/api/auth/[...all]/route.ts`).
  - Cabeçalho global exibindo estado de sessão e links de login/logout (`components/layout/app-header.tsx`).
  - Página de onboarding mínima e handlers para criação de conta (próxima subfase).
  - Documentação de readiness atualizada e matriz de checagem de pré-lançamento.
- Restrições: sem RBAC, sem middleware global, sem alterações de infra ou schema nesta etapa.

Próximos passos técnicos:

1. Implementar handler server-side idempotente para criar conta pessoal após callback de login (transação, verificação de existência).
2. Criar `/onboarding` com fluxo simples de perfil e criação de conta, e redirecionamento seguro após sucesso.
3. Cobrir fluxo com testes unitários e integração mínima em staging.

- Identificar as últimas superfícies transitional em páginas, routes, actions, services e componentes server-side.
- Reduzir dependências diretas ao fake adapter nas assinaturas públicas; preferir a camada controlada como boundary de entrada.
- Explicitar hotspots de fallback na observabilidade para apoiar estabilização por superfície.
- Classificar estados operacionais como transitional, stabilized e hardened sem mudar o domínio.
- Preparar o fake adapter para uso dev/test/recovery-only, mas só formalizar isso quando o fallback de runtime estiver near-zero.
- Evitar middleware global, RBAC, ACL, permission framework, auth rewrite e big bang migration.

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
- Billing individual recorrente como prioridade de produto

Fase 9: deploy e hardening

- GitHub Actions (lint/typecheck/build)
- Preparar deploy remoto seguro (secrets, proxy reverse)

Fase 10: governanca IA-First incremental

- Criar e evoluir specs por dominio antes de grandes refatoracoes
- Criar e revisar skills de apoio por area tecnica
- Registrar checkpoints operacionais em cada ciclo relevante
- Usar prompts padronizados para diagnostico, implementacao e validacao
- Consolidar o operating model em `AI_OPERATING_MODEL.md` como fonte de verdade para futuros SaaS DataVisio

Observação:

- Priorizar entregas mínimas por fase com testes e seeds.

## 1.3.29 — production env/secrets registrados

Objetivo:

- Registrar que o GitHub Environment `production` e as secrets já foram criados pelo operador.
- Preparar a auditoria do ambiente Docker/Traefik/Swarm/Portainer antes do workflow final de deploy.

Entregáveis desta etapa:

- Atualização do agente residente com as decisões de deploy.
- Atualização de `ENVIRONMENT.md`, `ARCHITECTURE.md`, `PROJECT_CONTEXT.md`, `DECISIONS.md`, `TODO_AI.md`, `CHANGELOG_AI.md` e `DAILY_CHECKPOINT.md`.
- Criação de runbook de deploy de production com comandos read-only para a próxima auditoria.

## 1.3.30 — auditoria Docker/Traefik/Swarm/Portainer

Objetivo:

- Auditar o servidor remoto, a pilha Docker e o Traefik existente antes de montar o workflow final.

Checklist da etapa:

- Verificar `whoami`, `hostname`, `pwd` e o diretório remoto esperado.
- Identificar se o ambiente usa Docker Compose standalone ou Docker Swarm.
- Identificar rede(s) e labels do Traefik existente.
- Confirmar containers/serviços existentes e o ponto de entrada de produção.
- Definir estratégia de build da imagem, healthcheck e rollback.

## 1.3.31 — artefatos Docker de produção

Objetivo:

- Definir os artefatos Docker necessários para produção com base na auditoria.
- Criar Dockerfile e `stack.visiomilhas.yml` compatíveis com Swarm e Traefik existente.
- Criar `.dockerignore` e healthcheck local do container.

## 1.3.32 — workflow de deploy

Objetivo:

- Criar o workflow de GitHub Actions para deploy remoto usando `environment: production`.
- Gerar `.env.production` no servidor e aplicar permissões restritas.
- Validar healthcheck e rollback do primeiro deploy.

## 1.3.31.1 — produção Swarm preparada

Objetivo:

- Consolidar os artefatos de produção com Next standalone, stack Swarm e labels Traefik corretas.

Próxima entrega:

- Seguir com 1.3.32: workflow de deploy remoto.

## 1.3.33 — primeiro deploy controlado

Objetivo:

- Executar o primeiro deploy controlado em produção com rollback documentado.

## 1.3.34 — QA pós-deploy

Objetivo:

- Validar o ambiente pós-deploy com QA funcional e revisão operacional.

## 1.3.30.1 — padronização de env example e docs

Objetivo:

- Padronizar `.env.example` com placeholders seguros.
- Atualizar a documentação operacional para a fonte de verdade de produção e deploy.

Próximo passo técnico:

- Siga com 1.3.31: artefatos Docker/Swarm de produção.

## 1.3.22 — Preparar staging e validar migration do ledger/lotes

Objetivo:

Entregáveis:

Nota operacional (2026-05-20):

Restrições:

2026-05-20 — 1.3.24.1: preparação de scripts

- Criados scripts locais para aplicar e validar o schema base em staging sem execução automática. Próxima etapa: revisão e autorização explícita para executar `npm run db:migrate:staging:base`.

DB: migrações e seeds (operação segura)

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

### 2026-05-20 — 1.3.25.1 (ampliação dos testes de integração MovementsRepo)

- Objetivo: consolidar e validar testes de integração reais do `MovementsRepo` contra `TEST_DATABASE_URL` cobrindo rollback, consumo FIFO por lotes e transferências.
- Status: testes implementados e validados localmente; recomendado rodar regressão em CI apontando para DB de teste isolado.

### 2026-05-20 — 1.3.25.2 (CI de integração MovementsRepo)

- Objetivo: integrar execução controlada dos testes de integração no CI (GitHub Actions) usando `TEST_DATABASE_URL` secret e sem tocar staging ou production.
- Ação tomada: criado `.github/workflows/integration-tests.yml` (manual via `workflow_dispatch`) que valida secret, executa preflight, aplica/valida migrations de teste e roda `npm run test:integration`.

### 2026-05-20 — 1.3.25.3 (execução manual do workflow CI)

- Objetivo: garantir que o operador humano pode configurar o secret `TEST_DATABASE_URL` e executar o workflow `Integration Tests - MovementsRepo` com segurança.
- Ação: documentação criada/atualizada com passos para adicionar o secret no GitHub e rodar o workflow manual (`workflow_dispatch`). Scripts de preflight/migrate/validate foram inspecionados para confirmar masking e detecção de comandos destrutivos.
- Próximo: operador adiciona `TEST_DATABASE_URL` como secret e executa o workflow; após sucesso, planejar PR/push e migração para QA em staging (sob autorização).

### 2026-05-20 — 1.3.26.1 (preparação do QA manual FIFO em staging)

- Objetivo: preparar a execução controlada do QA manual da compra FIFO em staging.
- Entregáveis: checklist de QA expandido, validador read-only parametrizado, comando npm explícito e instruções de ativação/rollback da flag em staging.
- Regras: não executar compra automaticamente, não alterar produção, não usar `DATABASE_URL`/`TEST_DATABASE_URL` para staging e não ativar `USE_FIFO_MOVEMENTS_ENGINE` sem confirmação do operador.
