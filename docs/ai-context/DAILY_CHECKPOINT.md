# CHECKPOINT - 1.3.34.1 — trava textual do dispatch manual

Data: 2026-05-22

- Branch atual: `1.3.34.1-fix-production-workflow-dispatch`.
- Objetivo: proteger o workflow manual de produção com confirmação textual antes de qualquer SSH/deploy.
- Correção aplicada: `workflow_dispatch` agora exige `confirm_production_deploy=DEPLOY` e expõe `image_tag` como input explícito.
- O workflow continua manual e sem gatilhos automáticos.
- Nenhum deploy foi executado.
- Nenhum comando remoto foi executado.
- Nenhuma migration, seed ou alteração funcional foi realizada.

Diagnóstico registrado:

- O `gh workflow run production-deploy.yml --ref main` havia retornado `HTTP 422: Workflow does not have 'workflow_dispatch' trigger` no contexto observado.
- A trava textual foi adicionada para impedir execução acidental do primeiro deploy.

Pendências:

- A alteração precisa ser publicada em PR/merge antes de qualquer tentativa de dispatch manual.

Próxima etapa recomendada:

1. Abrir PR para `main`, revisar e só depois considerar o dispatch manual com `DEPLOY`.

# CHECKPOINT - 1.3.32.1 — limpeza de artefatos externos locais

Data: 2026-05-22

- Branch atual: `1.3.32-production-deploy-workflow`.
- Status Git inicial desta subetapa: `?? .claude/`, `?? backend-livraria-node/`, `?? projetos/`.
- Objetivo: remover do caminho do workspace os diretórios externos que estavam quebrando `typecheck` e `build`.
- `backend-livraria-node/` e `projetos/` foram movidos para `../_fora_visiomilhas_acidental/`.
- `FoodComerce` foi preservado dentro de `../_fora_visiomilhas_acidental/projetos/`.
- Os diretórios originais permaneceram apenas com `.git` e deixaram de interferir nas validações do VisioMilhas.
- `npm run typecheck` passou após a limpeza.
- `npm run build` passou após a limpeza.
- `npm run lint` passou.
- `git diff --check` passou.
- Nenhum deploy, push, PR, migration ou seed foi executado.
- Nenhum arquivo funcional do VisioMilhas foi alterado.

Pendências:

- `.claude/` continua não rastreado e fora de commit.

Próxima etapa recomendada:

1. Manter a pasta segura fora do repositório e evitar que os diretórios externos retornem ao workspace.

# CHECKPOINT - 1.3.32 — revisão do workflow de deploy production

Data: 2026-05-22

- Branch atual: `1.3.32-production-deploy-workflow`.
- Status Git inicial desta etapa: `M .github/agents/visiomilhas.agent.md`, `M .github/workflows/production-deploy.yml`, `M README.md`, `M docs/ai-context/CHANGELOG_AI.md`, `M docs/ai-context/ENVIRONMENT.md`, `M docs/ai-context/PRODUCTION_DEPLOY_RUNBOOK.md`, `M docs/ai-context/TODO_AI.md`, `?? .claude/`, `?? backend-livraria-node/`, `?? projetos/`.
- Objetivo: revisar o workflow manual de deploy production, completar documentação operacional e validar localmente sem deploy.
- O workflow ficou manual via `workflow_dispatch`, com `environment: production` e `contents: read`.
- A geração de `.env.production` foi movida para o runner e enviada como arquivo temporário ao servidor.
- A validação de secrets passou a incluir autenticação e Stripe.
- O step de validação final passou a usar apenas `docker stack services` e `docker service ps`, sem logs do serviço.
- `npm run lint` passou.
- `npm run typecheck` falhou por erros pré-existentes em `projetos/FoodComerce/`, fora do escopo desta etapa.
- `npm run build` falhou pelo mesmo motivo pré-existente em `projetos/FoodComerce/`.
- `git diff --check` passou.
- Nenhum deploy foi executado.
- Nenhum push, PR, migration ou seed foi executado.
- Commit criado: `5d0ab31` (`ci: revisa workflow deploy production 1.3.32`).
- Status Git final: apenas `?? .claude/`, `?? backend-livraria-node/` e `?? projetos/` permanecem não rastreados; nenhum arquivo da revisão ficou pendente.

Pendências:

- O workspace ainda contém ruído não rastreado em `.claude/`, `backend-livraria-node/` e `projetos/`.
- `typecheck` e `build` continuam bloqueados por arquivos externos ao app principal.

Próxima etapa recomendada:

1. Revisar se o ruído dos subprojetos deve ser excluído do typecheck/build ou tratado separadamente antes de uma rodada de validação completa.

# CHECKPOINT - 1.3.31 — artefatos Docker Swarm de produção

Data: 2026-05-21

- Branch atual: `1.3.31-production-swarm-artifacts`.
- Status Git inicial desta etapa: `M .env.example`, `?? .claude/`.
- Objetivo: preparar Dockerfile, `.dockerignore`, `stack.visiomilhas.yml` e healthcheck para Swarm.
- `next.config.mjs` passou a usar `output: "standalone"`.
- `scripts/healthcheck.js` verifica `http://127.0.0.1:3000/` sem expor segredos.
- `stack.visiomilhas.yml` usa `traefik_public`, não publica `3000` no host e reutiliza o `certresolver` `le` confirmado na auditoria.
- Nenhum deploy foi executado.

Próxima etapa recomendada:

1. Rodar validações locais e então preparar o workflow de deploy 1.3.32.

# CHECKPOINT - 1.3.30.1 — padronização do .env.example e docs operacionais

Data: 2026-05-21

- Branch atual: `1.3.30.1-env-example-production-docs`.
- Status Git inicial desta etapa: `M .env.example`, `?? .claude/`.
- Objetivo: padronizar `.env.example` com placeholders seguros e alinhar a documentação operacional.
- `NODE_ENV=development` ficou explícito no exemplo; produção deve usar `production`.
- `USE_FIFO_MOVEMENTS_ENGINE=0` permanece como padrão no exemplo.
- `ENVIRONMENT.md` agora é a referência das variáveis base, compostas e da diferença entre `.env.example` e `.env.production`.
- `PRODUCTION_DEPLOY_RUNBOOK.md` explicita que `.env.production` será materializado pelo workflow.
- Nenhuma alteração de runtime, deploy ou servidor foi executada nesta etapa.

Próxima etapa recomendada:

1. Criar os artefatos Docker/Swarm de produção e o stack `stack.visiomilhas.yml`.

# CHECKPOINT - 1.3.30 — auditoria Docker/Traefik/Swarm em produção

Data: 2026-05-21

- Branch atual: `1.3.30-audit-docker-traefik-production`.
- Status Git inicial desta etapa: apenas `.claude/` não rastreado; nenhum arquivo versionado pendente.
- `git log` confirmou o commit `6070752` da etapa 1.3.29 no histórico local.
- Auditoria read-only executada via SSH com `gitdatavisiodeploy`.
- Swarm: ativo, node local manager, um único manager no cluster.
- Traefik: serviço do stack `traefik` na rede overlay `traefik_public`.
- `/opt/datavisio/visiomilhas`: existe, mas está vazio e sem repo Git nesta auditoria.
- Estratégia recomendada: `docker stack deploy` em Swarm.
- Nenhuma mudança foi aplicada no servidor remoto.

Próxima etapa recomendada:

1. Criar os artefatos Docker de produção para Swarm e o workflow de deploy.

# CHECKPOINT - 1.3.29 — production env e secrets registrados

Data: 2026-05-21

- Branch atual: `1.3.29-production-env-registered`.
- Status Git inicial desta etapa: `?? .claude/`.
- GitHub Environment `production` já foi criado pelo operador.
- Secrets de production já foram cadastradas pelo operador no Environment `production`.
- `.env.production` não foi criado nesta etapa.
- `USE_FIFO_MOVEMENTS_ENGINE` permanece `0` na produção inicial.
- Objetivo da próxima etapa: auditoria read-only de Docker, Traefik, Swarm, Portainer e diretório remoto.

Próxima etapa recomendada:

1. Executar a auditoria 1.3.30 apenas com comandos read-only no servidor remoto.

# CHECKPOINT - 1.3.27.1 — diagnóstico do runtime da compra FIFO

Data: 2026-05-21

- Branch atual: `1.3.27-qa-compra-fifo-staging`.
- Status Git inicial desta etapa: `M lib/repositories/movements.drizzle-repo.ts`, `?? .claude/`.
- Runtime local diagnosticado com `npm run db:diagnose:runtime`.
- Runtime local usa `APP_DATABASE_URL`.
- `current_database()` no runtime local: `visiomilhas_app`.
- `program_accounts`: FOUND.
- `mile_entries`: FOUND.
- `mile_point_lots`: MISSING.
- Staging segue validado: `staging_db` com `mile_point_lots` FOUND.
- Conclusão: erro é de ambiente/schema do runtime local, não de staging.
- Próximo passo: não concluir QA em localhost; usar o app staging real para a compra manual.

Próxima etapa recomendada:

1. Levar a compra manual para o app staging real e não para localhost.

# CHECKPOINT - 1.3.27 — QA controlado da compra FIFO em staging

Data: 2026-05-21

- Branch atual: `1.3.27-qa-compra-fifo-staging`.
- Status Git inicial desta retomada: `?? .claude/`.
- Preflight staging: OK, com `current_database(): staging_db` e host/usuário mascarados.
- Schema base staging: OK.
- Ledger/FIFO staging: OK.
- Validador read-only sem IDs: executado e sem compra/lote recente detectável; contadores retornaram `mile_entries_count: 0`, `mile_point_lots_count: 0`, `program_accounts_count: 0`.
- Compra manual ainda é necessária para continuar a validação com IDs.
- A flag foi informada como ativada manualmente pelo operador; o agente não alterou `.env`.
- Próximo passo: aguardar a compra de QA em staging e os identificadores para rodar o validador read-only com filtros.

Próxima etapa recomendada:

1. Fazer a compra pequena em staging com a flag ativa e informar os IDs gerados.

# CHECKPOINT - 1.3.26.3 — validação de runtime da página de compras

Data: 2026-05-21

- Objetivo: validar o runtime da página de compras antes de retomar o QA FIFO em staging.
- Branch atual: `1.3.26.2-fix-staging-qa-blockers`.
- Resultado: página `/app/purchases` abriu normalmente em `next dev`, sem reproduzir `Cannot redefine property: $$id`.
- Validações executadas: `npm run test` OK; `npm run typecheck` OK; `npm run lint` OK; `npm run build` OK.
- Runtime validado via navegador local em `http://localhost:3000/app/purchases`.
- Flag FIFO permaneceu OFF durante toda a validação.
- Nenhuma compra de teste foi executada.
- `.claude/` continua não rastreado e não foi incluído em nenhum commit.
- Pendência: manter QA staging pausado até nova autorização para reativar `USE_FIFO_MOVEMENTS_ENGINE`.

Próxima etapa recomendada:

1. Retomar o roteiro de QA em staging apenas após autorização explícita para reativar a flag FIFO.

---

## CHECKPOINT - 1.3.25.2 (CI de integração MovementsRepo)

Data: 2026-05-20

- Arquivo de workflow criado: `.github/workflows/integration-tests.yml`.
- Objetivo: permitir execução manual segura dos testes de integração contra `TEST_DATABASE_URL` no GitHub Actions.
- Próximo passo: adicionar `TEST_DATABASE_URL` como secret no repositório e executar o workflow manualmente.

Validações locais (2026-05-20):

- `npm run test` (unit + integração local): OK — observação: `test:integration` não foi executado isoladamente porque `TEST_DATABASE_URL` não está configurado no ambiente deste agente.
- `npm run typecheck`: OK
- `npm run lint`: OK
- `npm run build`: OK

Pendência operacional: configurar `TEST_DATABASE_URL` no GitHub Secrets e rodar o workflow manualmente para concluir a validação end-to-end (preflight, migrations e `npm run test:integration`).

## CHECKPOINT - 1.3.25.3 (execução manual do workflow CI)

Data: 2026-05-20

- Objetivo: instruir operador a configurar `TEST_DATABASE_URL` em GitHub Secrets e executar manualmente o workflow `Integration Tests - MovementsRepo`.
- Ações: documentos atualizados com passos de configuração manual e observações de segurança; scripts auditados para masking (preflight/migrate/validate/apply scripts usam masking e evitam imprimir segredos).
- Pendência: operador humano adiciona o secret `TEST_DATABASE_URL` no repositório e executa o workflow (workflow_dispatch). Após isto, coletar logs sanitizados e confirmar passagem completa.

Checklist operacional (para o operador):

- [ ] Acessar o repositório no GitHub.
- [ ] Settings → Secrets and variables → Actions → New repository secret → criar `TEST_DATABASE_URL` (valor: URL do test_db).
- [ ] Ir em Actions → `Integration Tests - MovementsRepo` → Run workflow → selecionar branch `1.3.25.3-ci-manual-run-instructions` (ou `1.3.25.4-ci-workflow-run-record`) → Run.
- [ ] Monitorar passos: Validate required secret, Preflight, Apply base, Validate base, Apply ledger, Validate ledger, Run integration tests.
- [ ] Coletar logs sanitizados (sem connection strings completas) e confirmar PASS/FAIL.

Registre aqui a data/hora e o resultado (operador):

- Data/hora:
- Branch usada:
- Resultado geral:
- Passos que passaram:
- Passo que falhou (se houver):
- Mensagem sanitizada de erro (se houver):

# CHECKPOINT - Encerramento do dia — 1.3.21

Data: 2026-05-18

---

# CHECKPOINT - 1.3.25 integração MovementsRepo em test_db

Data: 2026-05-20

- Branch: `1.3.25-integration-tests-movements-test-db` (local).
- Objetivo: preparar `test_db` via `TEST_DATABASE_URL`, aplicar schema base e ledger, e rodar testes de integração.

Ações realizadas:

- Criados scripts seguros para `test_db` em `scripts/`:
  - `apply-test-base-migrations.ts`
  - `apply-test-ledger-migration.ts`
  - `validate-test-base-schema.ts`
  - `validate-test-ledger-migration.ts`
- `package.json` atualizado com os scripts `db:migrate:test:base`, `db:migrate:test:ledger`, `db:validate:test:base`, `db:validate:test:ledger`.
- Preflight: `npm run db:preflight:test` — `current_database() = test_db` — OK.
- Aplicado: `npm run db:migrate:test:base` — `0000_misty_kulan_gath.sql` — OK.
- Validado: `npm run db:validate:test:base` — `program_accounts`, `mile_entries`, `mile_transfers` — FOUND.
- Aplicado: `npm run db:migrate:test:ledger` — `0001_add_mile_point_lots.sql` — OK.
- Validado: `npm run db:validate:test:ledger` — `mile_point_lots`, `mile_transfers`, índices — FOUND.
- Testes de integração: `npm run test:integration` — passou (2 tests).

Commits relevantes:

- `55fe906` — test: roda integracao do MovementsRepo contra test db 1.3.25 (scripts e testes)

Comandos perigosos NÃO executados:

- Não alterei staging; nenhuma operação em `STAGING_DATABASE_URL` foi executada nesta etapa.
- `npm run db:seed` — NÃO executado
- `npm run test:integration` — executado apenas contra `test_db` (permitido)

Próxima etapa recomendada:

1. Agendar execução de regressão de integração completa e coletar logs/outputs sanitizados para QA.

---

# CHECKPOINT - 1.3.26 staging QA compra FIFO

Data: 2026-05-20

## CHECKPOINT - 2026-05-20 — Fechamento seguro do dia (1.3.26.2)

- Branch atual: `1.3.26.2-fix-staging-qa-blockers`.
- Último commit local: `fc0bb46` — docs: define uso controlado de skills locais no agente (registro operacional).
- Correções realizadas nesta etapa (1.3.26.2):
  - `scripts/validate-staging-purchase-fifo.ts`: passou a usar `dotenv-expand` para resolver variáveis interpoladas (`STAGING_DATABASE_URL`).
  - `app/app/purchases/actions.ts`: separação entre implementação testável e wrapper Server Action (`"use server"` no wrapper) para evitar `Cannot redefine property: $$id`.
  - Registro e documentação do uso controlado das skills locais em `.github/agents/visiomilhas.agent.md`.
- Validações executadas: `npm run lint` — OK; `npm run typecheck` — OK; testes/build passaram em etapas anteriores da correção técnica.
- Pendência operacional: diretório não rastreado `.claude/` detectado (contém skills locais). A decisão operacional é não commitar `.claude` neste momento; registrar como pendência para avaliação posterior.

Recomendações de segurança e próximas ações:

- Manter `USE_FIFO_MOVEMENTS_ENGINE=0` em ambientes não validados até nova autorização.
- Validar runtime da página de compras localmente antes de ativar a flag em staging.
- Quando decidir versionar `.claude`, revisar cada `SKILL.md` e o código das skills para conformidade com regras de segurança e privacidade antes de commitar.
- Não fazer push/PR/deploy/seed/migration sem autorização explícita.

Status final do working tree (sanitizado):

- Arquivos modificados (docs): `.github/agents/visiomilhas.agent.md`, `docs/ai-context/CHANGELOG_AI.md`, `docs/ai-context/DAILY_CHECKPOINT.md`, `docs/ai-context/DECISIONS.md`, `docs/ai-context/TODO_AI.md`, `README.md`.
- Diretório não rastreado: `.claude/` (não será adicionado).

Registro concluído por: agente residente (local). Próxima retomada recomendada conforme checklist operacional.
Ações executadas nesta rodada:

Resumo sanitizado:

Comandos perigosos NÃO executados:

Pendências:

Próxima etapa recomendada:

1. Rodar as validações locais e, se passarem, revisar o checklist manual antes de autorizar a ativação da flag em staging.

# CHECKPOINT - 1.3.26.1 preparação do QA manual FIFO

- Checklist de QA expandido com pré-condições, ativação controlada da flag, roteiro de compra, validação read-only e rollback.
- Script `scripts/validate-staging-purchase-fifo.ts` revisado para exigir `STAGING_DATABASE_URL`, validar `current_database() = staging_db` e aceitar parâmetros seguros opcionais.
- Script npm `db:validate:staging:purchase-fifo` adicionado ao `package.json`.
- Documentação operacional atualizada para manter `USE_FIFO_MOVEMENTS_ENGINE=1` somente em staging e `0` em produção.

Resumo sanitizado:

- Validador read-only preparado para `--account-id`, `--purchase-id` e `--entry-id`.
- Nenhuma compra executada.
- Nenhuma alteração em staging ainda aplicada nesta etapa.

Comandos perigosos NÃO executados:

- `npm run db:seed`
- qualquer deploy
- qualquer alteração em produção
- qualquer uso de `DATABASE_URL`/`TEST_DATABASE_URL` para staging

Pendências:

- Operador ativa a flag em staging, registra horário e executa a compra de teste.
- Depois, rodar `npm run db:validate:staging:purchase-fifo` com os identificadores coletados.

Próxima etapa recomendada:

1. Aguardar o operador executar a compra de teste em staging e fornecer `accountId`, `purchaseId`/`entryId`, pontos e horário aproximado.

---

## CHECKPOINT - 1.3.25.1 (ampliação dos testes de integração MovementsRepo)

Data: 2026-05-20

- Branch criada: `1.3.25.1-integration-tests-rollback-transfer` (local).
- Objetivo: ampliar e validar testes de integração do `MovementsRepo` contra `TEST_DATABASE_URL`.
- Ações executadas:
  - Adicionados testes em `tests/integration/movements.drizzle-repo.test.ts` cobrindo rollback, FIFO e transferências.
  - Rodado `npm run test:integration` contra `TEST_DATABASE_URL` — OK (5/5).
  - Rodado `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build` — OK.
- Comandos perigosos NÃO executados: staging, seeds, push/PR.

Próximo passo: reunir evidências sanitizadas e programar regressão CI contra DB de teste isolado.

Status dos testes e validações (local):

- `npm run test`: OK (todos os testes unitários passaram localmente)
- `npm run typecheck`: OK
- `npm run lint`: OK
- `npm run build`: OK

O que foi concluído hoje:

- Adicionados testes unitários para `createPurchaseAction` cobrindo flag off, flag on, e rollback simulado.
- Refatorado `createPurchaseAction` para permitir injeção de `deps` (clientes de DB, feature flag, use-case, revalidatePath) para melhorar testabilidade.
- Correção menor em `lib/featureFlags.ts` para satisfazer lint e exportação nomeada.
- Documentação atualizada com changelog e decisão resumida (1.3.21).

O que NÃO foi feito hoje:

- Não apliquei migrations (especificamente `db/app/migrations/0001_add_mile_point_lots.sql`).
- Não executei seeds.
- Não rodei testes de integração contra DB real.
- Não fiz push nem abri PR.

Riscos atuais:

- Rollback real ainda não validado com DB isolado; dependente de aplicação da migration em staging.
- Ativar a feature flag sem validação em staging pode causar inconsistências e exigir rollback em produção.

Próximos passos recomendados:

1. Provisionar DB isolado/staging e aplicar `db/app/migrations/0001_add_mile_point_lots.sql`.
2. Rodar testes de integração (`npm run test:integration`) e validar rollback real.
3. Ativar `USE_FIFO_MOVEMENTS_ENGINE` apenas em staging após QA completa.
4. Integrar vendas/consumo/transferência ao motor FIFO somente após validação de compra em staging.

Previsão de lançamento (estimativa):

- MVP beta controlado: 5 a 8 dias úteis, condicionado à validação em staging, migration, testes de integração e QA.
- MVP produção inicial: 8 a 12 dias úteis, condicionado a backup/rollback, deploy remoto, observabilidade mínima e validação ponta a ponta.

Observação: NÃO foi usado DB real; não houve exposição de `.env` ou secrets durante as tarefas de hoje.

---

# CHECKPOINT - Recuperação 1.3.24.1

Data: 2026-05-20

- Objetivo: recuperar o estado da execução interrompida da etapa `1.3.24.1` e preparar avanço controlado para `1.3.24.2`.
- Branch verificada: `1.3.24.1-staging-base-schema` (local).
- Status Git inicial: working tree limpo (sem alterações locais detectadas).

Commits relevantes encontrados:

- 76289cc — docs: registra scripts de schema base staging 1.3.24.1
- a01e5e2 — chore: prepara scripts seguros para schema base staging 1.3.24.1

Verificações realizadas:

- `package.json` contém scripts `db:migrate:staging:base`, `db:validate:staging:base`, `db:validate:staging:ledger`.
- Arquivos de script presentes em `scripts/`:
  - `apply-staging-base-migrations.ts`
  - `validate-staging-base-schema.ts`
  - `validate-staging-ledger-migration.ts`
- Inspeção rápida dos três scripts: usam `STAGING_DATABASE_URL`, validam `current_database()`, consultam apenas `information_schema` quando apropriado, não imprimem credenciais completas, aplicam migração controlada e não executam seeds.

Alterações efetuadas:

- Atualizei `.github/agents/visiomilhas.agent.md` adicionando a seção **Checkpoints operacionais recuperáveis** para garantir que sessões futuras deixem um resumo restaurável.

Comandos perigosos NÃO executados neste checkpoint:

- `db:migrate:staging:base` — NÃO executado
- `db:migrate:staging:ledger` — NÃO executado
- `db:validate:staging:base` / `db:validate:staging:ledger` — NÃO executados
- `npm run test:integration` — NÃO executado

Pendências e próxima etapa recomendada:

1. Confirmar se o commit que adicionou/registrou os scripts (`a01e5e2` / `76289cc`) cobre as alterações esperadas. (Já foi detectado que os commits existem.)
2. Se desejar que eu regularize/complete algo faltante, autorize criar um commit local com os scripts/ajustes; caso contrário, prossiga para criar/usar a branch `1.3.24.2-apply-base-and-ledger-staging` para execução controlada.
3. Antes de aplicar migrations em staging, executar `npm run db:preflight:staging` e confirmar `current_database()` aponta para o DB de staging.

Notas de segurança: não exibi nem gravei variáveis de ambiente ou secrets. Todas as ações locais respeitam a regra de usar apenas `STAGING_DATABASE_URL` para operações de staging.

---

# CHECKPOINT - 1.3.24.2 aplicação controlada

Data: 2026-05-20

- Branch criada: `1.3.24.2-apply-base-and-ledger-staging` (local).
- Preflight: `npm run db:preflight:staging` — `current_database() = staging_db` (mascarado) — OK.
- Aplicado: `npm run db:migrate:staging:base` → `0000_misty_kulan_gath.sql` (transacional) — OK.
- Validado base: `npm run db:validate:staging:base` → `program_accounts`, `mile_entries`, `mile_transfers` — FOUND.
- Aplicado: `npm run db:migrate:staging:ledger` → `0001_add_mile_point_lots.sql` — OK.
- Validado ledger: `npm run db:validate:staging:ledger` → `mile_point_lots`, `mile_transfers`, índices principais — FOUND.

Comandos perigosos NÃO executados:

- `npm run db:seed` — NÃO executado
- `npm run test:integration` — NÃO executado

Commits criados/alterados nesta sequência:

- cd176cd — docs: adiciona checkpoints recuperaveis ao agente

Próxima etapa recomendada:

1. Registrar evidências de QA e executar `npm run test:integration` em ambiente isolado (apenas após confirmação de backup/snapshot).
2. Manter flag `USE_FIFO_MOVEMENTS_ENGINE` desativada até validação completa de integração/QA.

---
