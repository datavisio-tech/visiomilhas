# TODO_AI - Pendências e próximas ações

## 1.3.34.3 — reindex do workflow manual por novo filename

- Confirmar que `production-deploy-manual.yml` é o novo arquivo fonte do workflow de produção.
- Manter `workflow_dispatch` como único gatilho.
- Manter `confirm_production_deploy=DEPLOY` obrigatório.
- Não executar `gh workflow run` nesta etapa.
- Não alterar secrets, servidor, migrations ou seeds.
- Aguardar PR/merge antes de qualquer execução manual.

Concluído nesta etapa:

- O workflow foi renomeado para forçar reindexação pelo GitHub Actions.

## 2.4-D — Better Auth Bootstrap Guard & Operational Recovery

- Implementar guard mínimo em `lib/auth.ts` para evitar crash runtime quando variaveis de ambiente estiverem ausentes.
- Ajustar `app/api/auth/[...all]/route.ts` para retornar JSON 503 controlado enquanto o auth estiver indisponivel.
- Validar browser flows localmente e em staging apos provisionar envs.

## 1.3.35 — alinhamento arquitetural IA-First

- Registrar as respostas arquiteturais de produto no contexto operacional.
- Atualizar PROJECT_CONTEXT, ARCHITECTURE, DECISIONS, IMPLEMENTATION_PLAN, CHANGELOG_AI e DAILY_CHECKPOINT com a direcao B2C individual.
- Criar a estrutura base de docs/specs e docs/ai-skills.
- Manter o escopo incremental, sem big bang refactor.
- Nao alterar schema, migrations, seeds, deploy de producao nem feature flags nesta etapa.
- Consolidar o operating model em `AI_OPERATING_MODEL.md` e apontar os docs centrais para ele.

Decisões registradas:

- B2C individual, assinatura mensal recorrente.
- Sem white-label.
- Permissoes simples: usuario comum e admin interno.
- IA no produto nao e prioridade inicial.
- Monolito modular como base.
- Observabilidade minima inicialmente.

## 1.3.36 — operating model IA-First consolidado

- Criar `docs/ai-context/AI_OPERATING_MODEL.md` como fonte de verdade para governanca IA.
- Registrar a relacao entre Context, Specs, Skills, Agents e Prompts.
- Criar ou alinhar o agente de infraestrutura persistente.
- Atualizar CHANGELOG_AI, IMPLEMENTATION_PLAN, DECISIONS e DAILY_CHECKPOINT com o rationale do modelo.
- Nao alterar runtime, deploy, Docker, auth, workflows, banco ou producao.

Decisões registradas:

- Infraestrutura real influencia o desenho da IA.
- Poucos agents com responsabilidade clara sao melhores do que muitos agents superficiais.
- Human-in-the-loop continua obrigatorio para deploy, migrations, secrets e billing critico.

## 2.2-I — AI Knowledge & Skill Consolidation

Concluído nesta etapa:

- Consolidada a hierarquia oficial entre docs, specs, skills e agents.
- `AI_OPERATING_MODEL.md` passou a explicitar a hierarquia, o sync model e as responsabilidades por camada.
- `docs/specs/ai-agents.spec.md`, `docs/ai-skills/README.md`, `.github/agents/*` e `.claude/skills/*` foram alinhados ao mesmo boundary model.
- Drift futuro deve continuar registrado em `CHANGELOG_AI.md` e `DAILY_CHECKPOINT.md`.

Decisões registradas:

- Docs estratégicos continuam sendo a fonte de verdade.
- Skills operacionalizam contratos oficiais.
- Agents orquestram e registram checkpoints.

## 2.2-J — AI Governance Versioning

Concluído nesta etapa:

- `AI_OPERATING_MODEL_VERSION=2.2-I` consolidado como baseline oficial ativa.
- Criada a matriz de compatibilidade no operating model com versões de skills, agents e governanças associadas.
- Skills e agents receberam metadata de versão e compatibilidade simples.
- Regras de drift e gatilhos de bump de versão foram documentados.

Decisões registradas:

- Semver complexo e tooling automático continuam fora do escopo.
- O versionamento serve para rastreabilidade, auditoria e sincronização incremental.

## 2.2-C — Ownership Hardening

- Remover `orgSlug` dos contratos de escrita e depender da ownership resolvida no servidor.
- Validar origem e destino em transferencias sob a mesma ownership.
- Reduzir a confiança em `organizationId` vindo da UI.
- Manter `controlled-session.ts` como entrada única para boundaries migradas.
- Preparar a redução gradual do fake adapter sem middleware global agressivo.

Decisões registradas:

- `organizationId` continua como contexto de dados, nao como boundary de cliente.
- `orgSlug` sai dos fluxos de escrita para reduzir confiança em input de front.
- Repositories devem continuar recebendo contexto mínimo, sem acesso direto à sessão.

## 2.2-D — Better Auth Operational Consolidation

- Tornar Better Auth o caminho primário operacional de sessão para as rotas já migradas.
- Manter fake-auth-adapter como transitional para desenvolvimento local, testes e recovery controlado.
- Registrar fallback com origem, motivo e timestamp em `auth-observability.ts`.
- Migrar as rotas restantes uma por vez, sem big bang.
- Definir critérios futuros de remoção do fallback quando a estabilidade e a telemetria forem suficientes.

Decisões registradas:

- O fallback continua aceitável enquanto for observável, auditável e simples de reativar.
- A remoção do fake adapter só deve acontecer após estabilidade operacional contínua e uso quase nulo.
- Não introduzir middleware global nem RBAC complexo nesta fase.
# TODO_AI - Pendências e próximas ações

## 2.2-F — Transitional Surface Cleanup

- O fake adapter não vira dev/test-only oficialmente antes de o runtime estabilizar.

## 2.2-G — Transitional Finalization & Recovery-Only Fallback

- Confirmar que o boundary de leitura ficou hardened por padrão e só aceita fallback em recovery explícito.
- Monitorar o readiness score, fallback rate e hotspots por source.
- Manter o fake adapter disponível para dev, testes e recovery controlado.
- Reduzir quaisquer hotspots residuais antes de considerar a remoção opcional do fake adapter do runtime principal.

Decisões registradas:

- O runtime normal não deve depender de fallback implícito.
- Recovery-only continua aceitável como contingência operacional.
- A retirada do fake adapter só deve ser avaliada depois de fallback near-zero e cobertura hardened suficiente.

## 2.2-E — Fallback Reduction & Stabilization

- Medir uso real do fallback por source, reason e timestamp.
- Migrar rotas restantes para o caminho controlado por Better Auth.
- Reduzir caminhos transitional de forma incremental e segura.
- Manter rollback simples enquanto o fallback continuar necessário.
- Evitar middleware global, RBAC, ACL, auth microservice e reescrita ampla do domínio.
- Atualizar a matriz operacional com status Better Auth, fallback usage, ownership status, rollout status e stabilization level.
- Documentar readiness para remoção futura com fallback near-zero, cobertura mínima e ausência de incidentes.

Decisões registradas:

- A fase é de estabilização, não de reescrita.
- A redução do fallback depende de métricas, não de suposição.
- O fake adapter continua transitional até a remoção segura.

## 2.2-F — Transitional Surface Cleanup

- Mapear as últimas superfícies transitional que ainda podem acionar fallback.
- Reduzir dependências diretas ao fake adapter nas APIs públicas.
- Acompanhar hotspots de fallback por source e motivo.
- Classificar surfaces como transitional, stabilized ou hardened com base em uso real.
- Preparar o fake adapter para dev/test/recovery-only apenas quando o fallback de runtime estiver near-zero.

Decisões registradas:

- O boundary de leitura continua controlado e observável.
- O fake adapter não vira dev/test-only oficialmente antes de o runtime estabilizar.
- A saída é incremental e reversível por superfície.

## 2.3-C — Initial User Onboarding Flow

- Implementar `/onboarding` com server action para criação idempotente de organização pessoal e conta app.
- Integrar provisionamento não-blocking na resolução de sessão e redirecionamento server-side para onboarding quando apropriado.
- Validar em staging com Google OAuth e monitorar `auth-observability` para erros de provisionamento.

## 2.3-D — Onboarding Telemetry & Auth Flow Stabilization

- Instrumentar `onboarding_started`, `onboarding_completed` e `onboarding_failed` em `auth-observability`.
- Garantir retry seguro e UX mínima com loading/erro/sucesso na página `/onboarding`.
- Atualizar readiness para staging real: onboarding, auth, OAuth, observability e deploy.
- Auditar duplicidade, slug collision e race conditions sem introduzir locking complexo.

## 2.3-E — Staging Validation & OAuth Runtime Hardening

- Validar Google OAuth em staging real, incluindo callback, sessão, logout e refresh.
- Monitorar `OAUTH_CALLBACK_FAILED`, `OAUTH_REDIRECT_LOOP`, `ONBOARDING_RECOVERY` e `ONBOARDING_DUPLICATE_PREVENTED`.
- Manter fallback recovery-only e registrar hotspots residuais antes do primeiro grupo de usuários.
- Evitar qualquer mudança de deploy, Docker, middleware global ou arquitetura nova.

## 2.3-G — First Real Staging Validation & OAuth Operational Audit

- Validar staging real e registrar checklist operacional antes do rollout controlado.
- Monitorar callback failures, redirect loops, onboarding recovery e duplicate prevention.
- Separar readiness em stable, transitional e recovery-only para OAuth, onboarding, runtime, recovery, observability e deploy.
- Evitar qualquer mudança de arquitetura, deploy ou infraestrutura.

## 2.4-A — Controlled Real Staging Rollout

- Preparar checklist final de rollout controlado com usuários reais de teste.
- Monitorar callback failures, redirect loops, onboarding recovery, duplicate prevention e hotspots residuais.
- Classificar readiness final para OAuth, onboarding, runtime, recovery, staging e deploy antes de ampliar acesso.
- Manter rollback simples, fallback recovery-only e sem mudança de infraestrutura.

## 2.4-B — Real Interface Validation & Browser Runtime Audit

- Manter a rota pública de sign-in como entrada browser-first para OAuth.
- Validar visualmente loading, erro, redirect, callback e retorno do onboarding/dash em browser real.
- Acompanhar o comportamento em desktop/mobile, refresh e reopen sem alterar arquitetura.
- Se o OAuth staging estiver pronto, repetir o roteiro com usuário real de teste.

## 2.1-B — auth helpers reais e provider-agnostic

- Implementar helpers reais para AuthContext, OwnershipContext e SessionContext.
- Manter a camada sem dependencia de Better Auth.
- Reduzir organization_id a compatibilidade futura, nao boundary principal.
- Mapear protecao inicial para compras, vendas, transferencias, entries, dashboard, accounts e programs.
- Documentar as boundaries de routes, Server Actions, services e repositories.
- Nao alterar runtime, banco, migrations, workflows ou deploy.

Decisões registradas:

- Better Auth sera apenas um adaptador futuro, nao uma dependencia desta fase.
- Google OAuth entra primeiro.
- Ownership por userId e o eixo principal.
- Sem memberships complexas e sem RBAC enterprise.

## 2.1-C — boundary integration sem provider

- Integrar os helpers nas rotas e Server Actions mais criticas.
- Proteger primeiro purchases, sales e transfers.
- Simular boundary com fake auth adapters controlados antes do provider real.
- Adiar middleware global para depois da consolidacao do fluxo server-side.
- Manter schema inalterado nesta etapa.

Decisões registradas:

- requireOwnership deve ser orientado a recurso, via accountUserId.
- organizationId nao deve voltar a ser boundary principal.
- A proxima fase de auth real virá depois do boundary simulation estabilizar.

Seguranca adicional a auditar:

- secrets historicos no git e em logs de actions.
- GOOGLE_CLIENT_SECRET, AUTH_SECRET, DATABASE_URL e SSH_PRIVATE_KEY.
- .gitignore e historico git.

## 2.2 — Better Auth foundation

- Manter `fake-auth-adapter` e `read-scope` por enquanto.
- Preservar `AuthContext`, `OwnershipContext` e `SessionContext` como contratos centrais.
- Integrar Better Auth apenas como adaptador externo de sessao e callback.
- Expor handler App Router em `/api/auth/[...all]`.
- Usar Google OAuth como primeiro provider.
- Garantir cookies seguros/httpOnly e trusted origins apenas das origens esperadas.
- Registrar e auditar `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.
- Conferir que o rollout nao cria middleware global nem muda schema de negocio nesta etapa.

## 2.2-B — controlled session migration
## 2.3-A — SaaS B2C Onboarding Foundation (next)

- Implementar handler server-side idempotente para criação automática de conta pessoal após callback de login.
- Criar página `/onboarding` com fluxo minimal de perfil e criação de conta.
- Garantir que o fluxo seja observável (auth-observability) e cobrir com testes.

- Migrar apenas `purchases`, `sales` e `transfers` para a sessão Better Auth controlada.
- Manter `fake-auth-adapter` como fallback operacional enquanto a migração estiver em curso.
- Centralizar a resolução de sessão em `resolveCurrentBetterAuthSessionContext()` via uma única camada controlada.
- Adicionar observabilidade mínima para falhas de sessão, fallback e bloqueios de auth.
- Criar testes de boundary para sessão ausente, fallback acionado e ownership negado.

## 2.1-D — read enforcement

- Remover slug e params das leituras criticas.
- Passar sessionContext para dashboard, accounts, entries, purchases, sales e transfers.
- Derivar organizationId no servidor, nunca no client.
- Criar fake session resolver unico para leitura.
- Manter middleware global fora do escopo.

Decisões registradas:

- service continua como boundary principal.
- repository segue executando query minima.
- route/server component nao deve resolver ownership por conta própria.

## 1.3.34.1 — trava textual do dispatch manual

- Confirmar que `confirm_production_deploy=DEPLOY` é obrigatório antes de qualquer SSH/deploy.
- Manter `workflow_dispatch` como único gatilho do workflow de produção.
- Não executar `gh workflow run` nesta etapa.
- Não tocar em secrets, servidor, migrations ou seeds.
- Aguardar PR/merge antes de qualquer execução manual.

Concluído nesta etapa:

- O workflow de produção recebeu inputs explícitos e trava textual.

## 1.3.32.1 — limpeza de artefatos externos locais

- Manter `backend-livraria-node/` e `projetos/` fora do workspace do VisioMilhas.
- Preservar os artefatos movidos em `../_fora_visiomilhas_acidental/`.
- Evitar que `FoodComerce` volte a aparecer na árvore do VisioMilhas.
- `.claude/` continua fora de commit.

## 1.3.32 — revisão do workflow de deploy production

- Revisar o workflow `workflow_dispatch` antes do PR.
- Confirmar que todas as secrets de production estão configuradas corretamente.
- Confirmar permissão de escrita em `/opt/datavisio/visiomilhas` para `gitdatavisiodeploy`.
- Executar o workflow manual somente após PR/merge autorizado.
- Validar o primeiro deploy controlado antes de liberar o rollout.
- Planejar o rollback operacional do primeiro deploy.

Pendências específicas:

- `USE_FIFO_MOVEMENTS_ENGINE` permanece `0` na produção inicial.
- `.claude/` continua fora de commit.

## 1.3.29 — production env/secrets registrados

- Auditar servidor via SSH antes de qualquer deploy.
- Identificar se o ambiente remoto usa Docker Compose standalone ou Docker Swarm.
- Identificar a rede do Traefik existente.
- Identificar labels e entrypoints usados pelo Traefik.
- Confirmar a estratégia de build da imagem de produção.
- Definir healthcheck para o container da aplicação.
- Definir rollback operacional para o primeiro deploy.
- Manter `USE_FIFO_MOVEMENTS_ENGINE=0` na produção inicial.
- Não criar `.env.production` real no repositório.

## 1.3.30 — auditoria Docker/Traefik/Swarm concluída

- Swarm está ativo no host de produção e o node atual é manager único.
- Traefik existe como serviço do stack `traefik` na rede overlay `traefik_public`.
- O diretório `/opt/datavisio/visiomilhas` existe, mas está vazio e ainda não contém repo Git.
- A estratégia recomendada agora é construir artefatos para `docker stack deploy`.
- Próximo passo técnico: criar Dockerfile/stack e depois o workflow de deploy.

## 1.3.30.1 — env example e docs padronizados

- `.env.example` precisa ficar apenas com placeholders seguros e sem valores reais.
- `ENVIRONMENT.md` deve ser a referência de convenção de variáveis de produção.
- `PRODUCTION_DEPLOY_RUNBOOK.md` deve continuar a fonte operacional para `.env.production` e `chmod 600` remoto.
- Próxima etapa técnica: criar `stack.visiomilhas.yml`, Dockerfile e workflow de deploy.
- Validar healthcheck e rollback na mesma trilha de produção.

## 1.3.31 — artefatos Swarm em andamento

- `certresolver` do Traefik confirmado como `le` e será reutilizado.
- Decidir a estratégia de imagem para o primeiro deploy: build no servidor sem registry obrigatório nesta etapa.
- Validar que o stack não publica `3000` diretamente no host.
- Definir rollback operacional do stack `visiomilhas`.
- Criar workflow de deploy apenas na próxima etapa.

Concluído recentemente:

- Diagnóstico 1.3.27.1 do runtime local: usa `APP_DATABASE_URL`, aponta para `visiomilhas_app` e não possui `mile_point_lots`.

Pendência imediata:

- Não usar localhost para concluir o QA staging.
- Executar a compra manual no app staging real, onde `mile_point_lots` já foi validado.

Pendência para a próxima etapa:

- Rodar apenas comandos read-only na auditoria de produção e registrar host, diretório remoto, modo Docker e Traefik.

Observação:

- A alteração funcional pendente do loop anterior foi revertida antes do commit.

Concluído recentemente:

- QA 1.3.27 retomado em staging: preflight, base, ledger e validador read-only sem IDs passaram, mas sem compra detectável.

Pendência imediata:

- Aguardar compra manual pequena em staging com a flag ativa e receber `accountId`/`purchaseId`/`entryId` para rodar a validação read-only filtrada.
- Solicitar rollback da flag para `USE_FIFO_MOVEMENTS_ENGINE=0` após o QA.

Concluído recentemente:

- Validar runtime da página de compras 1.3.26.3: OK, sem reproduzir `Cannot redefine property: $$id`; `USE_FIFO_MOVEMENTS_ENGINE` permaneceu OFF.

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
- Validar runtime da página de compras antes de retomar QA FIFO em staging (1.3.26.3).

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

- Criar `docs/ai-context/STAGING_MIGRATION_RUNBOOK.md` (feito)

2026-05-20 — 1.3.24.1: preparar scripts de schema base em staging

- Criar `scripts/apply-staging-base-migrations.ts` (feito)
- Criar `scripts/validate-staging-base-schema.ts` (feito)
- Criar `scripts/validate-staging-ledger-migration.ts` (feito)
- Revisar e autorizar execução em etapa seguinte.
- Validar `db/app/migrations/0001_add_mile_point_lots.sql` em revisão (pendente)
- Planejar execução controlada em staging (pendente)

Status: padronização do runtime

- Arquivos `.nvmrc` e `.node-version` adicionados com `24`.
- Atualizar ambiente local para Node 24 e rodar `npm install` + `npm run test`.

Versionamento operacional:

- Regra: `MVP.Funcionalidade.Commit` (ex.: `1.1.7`).
- Versão operacional atual: `1.2.2`.

Atualização operacional:

- Versão operacional atual: `1.2.8` (fechamento de leituras e clubes).
- Próximo passo recomendado: `1.3.1` — iniciar CRUD operacional de compras, vendas e transferências.

2026-05-20 — 1.3.25.1 (ampliação dos testes de integração MovementsRepo)

- Implementar e validar localmente testes de integração do `MovementsRepo` contra `TEST_DATABASE_URL` (rollback, FIFO, transfer) — CONCLUÍDO localmente;
- Próximo: coletar evidências sanitizadas e integrar regressão em CI contra DB de teste isolado.

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

Pendências (relacionadas a 1.3.21):

- Provisionar DB isolado/staging para validar `db/app/migrations/0001_add_mile_point_lots.sql`.
- Rodar `npm run test:integration` contra o DB isolado após aplicar a migration.
- Validar rollback real em transações que envolvem `createPurchaseAction` + `acquireMilesUseCase`.
- Ativar `USE_FIFO_MOVEMENTS_ENGINE` em staging somente após validação completa.
- QA da compra/aquisição em staging com dados demo (sem afetar produção).
- Planejar integração de venda/consumo/transferência após sucesso em staging.
- Revisar implicações contábeis de custo/margem antes de ativar em produção.
- Configurar secret `TEST_DATABASE_URL` no GitHub e executar o workflow `.github/workflows/integration-tests.yml` manualmente para validar regressão CI.
  - Observação: este agente não configura o secret automaticamente. Após configurar o secret, executar manualmente o workflow via GitHub (workflow_dispatch) e coletar artefatos sanitizados.

2026-05-20 — 1.3.25.3 (execução manual do workflow CI)

- Adicionar instruções para operador:
  1. GitHub → Settings → Secrets and variables → Actions → New repository secret → `TEST_DATABASE_URL`.
  2. Actions → `Integration Tests - MovementsRepo` → Run workflow → selecionar branch `1.3.25.3-ci-manual-run-instructions` → Run.
  3. Conferir logs sanitizados e validar passos (`preflight`, `migrate`, `validate`, `test:integration`).

  Checklist rápido para operador (copiar/colar):
  1. GitHub → Settings → Secrets and variables → Actions → New repository secret
  - Nome: TEST_DATABASE_URL
  - Valor: (URL segura do test_db)
  2. Actions → Integration Tests - MovementsRepo → Run workflow → selecionar branch `1.3.25.3-ci-manual-run-instructions` → Run
  3. Aguardar execução e confirmar que os passos passaram; coletar logs sanitizados.

2026-05-20 — 1.3.26 (QA compra FIFO em staging)

- Branch de trabalho: `1.3.26-qa-compra-fifo-staging`
- Preflight staging: concluído com `current_database(): staging_db`
- Validação base staging: concluída
- Validação ledger staging: concluída
- Próximo passo: executar validações locais (`test`, `typecheck`, `lint`, `build`) e depois o checklist manual de QA da compra FIFO em staging
- Regra: não ativar `USE_FIFO_MOVEMENTS_ENGINE` em produção; qualquer ativação em staging depende de nova autorização explícita

2026-05-20 — 1.3.26.1 (preparação do QA manual FIFO)

- Checklist de QA expandido com roteiro de ativação da flag em staging, rollback operacional e parâmetros de validação.
- Adicionado script npm `db:validate:staging:purchase-fifo`.
- Próximo passo: aguardar o operador ativar `USE_FIFO_MOVEMENTS_ENGINE=1` apenas em staging, registrar os IDs da compra e então executar a validação read-only.

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

2026-05-20 — Uso controlado de skills locais (decisão operacional)

- Registrar as skills locais instaladas em `.claude/skills` e seu escopo de uso no agente residente.
- Skills detectadas: `code-review`, `frontend-patterns`, `saas-multi-tenant`, `security-review`, `test`.
- Ação: atualizar `.github/agents/visiomilhas.agent.md` com regras e limites (feito localmente).
- Validação: rodar `npm run lint` e `npm run typecheck` após alterações documentais.

Pendência adicional — diretório `.claude`:

- O diretório `.claude/` existe localmente e contém skills auxiliares (SKILL.md e implementações).
- Decisão atual: **não commitar `.claude/`**; registrar como pendência para avaliação futura.
- Ação recomendada antes de versionar `.claude`:
  1. Revisar cada `SKILL.md` para garantir que não exponha segredos, URLs ou instruções operacionais perigosas.
  2. Validar permissões de rede/IO esperadas pelas skills.
  3. Documentar quais skills, se any, serão versionadas e quais permanecerão locais.

Nota (2026-05-18): adicionado esqueleto de testes de integração em `tests/integration/movements.drizzle-repo.test.ts`.
Estes testes são placeholders e dependem de variáveis de ambiente (`APP_DATABASE_URL` ou `DATABASE_URL`) apontando para um banco de desenvolvimento isolado. Não execute `npm run test:integration` contra bancos de produção.

Status 1.3.20 — integração atômica da compra ao motor FIFO:

- Implementado `createDrizzleMovementsRepoFromClient(client)` em `lib/repositories/movements.drizzle-repo.ts` para criar um repo Drizzle que usa o `pg` client existente.
- `createPurchaseAction` em `app/app/purchases/actions.ts` foi atualizado para, quando `USE_FIFO_MOVEMENTS_ENGINE` estiver ativa, delegar ao `acquireMilesUseCase(..., txRepo)` executando o use-case dentro da mesma transação da compra.
- Pendências: validar a migration `db/app/migrations/0001_add_mile_point_lots.sql` em ambiente isolado, executar testes de integração e validar rollback antes de ativar a flag em staging.
