# STAGING MIGRATION RUNBOOK — 1.3.22 ledger/lotes

Objetivo: validar com segurança a migration `db/app/migrations/0001_add_mile_point_lots.sql` em um ambiente de staging isolado, garantindo rollback e critérios para ativar a feature flag `USE_FIFO_MOVEMENTS_ENGINE` apenas após validação completa.

Pré-requisitos:

- Ter um banco de staging isolado (não produção) acessível e com snapshot/backup recente.
- Variável `STAGING_DATABASE_URL` apontando para o DB de staging configurada em secrets/ambiente.
- Acesso a um usuário com permissões para aplicar migrations em staging (restringir privilégios em produção).
- Confirmação explícita do time antes de aplicar qualquer migration.

Checklist pré-aplicação (auditoria):

1. Verificar branch e working tree limpo:
   - `git branch --show-current`
   - `git status --short`
2. Conferir a migration proposta: `db/app/migrations/0001_add_mile_point_lots.sql` — revisar FKs, índices e checks.
3. Conferir o schema Drizzle em `db/app/schema.ts` e garantir consistência de nomes e tipos.
4. Verificar scripts de DB em `package.json` (`db:app:migrate`, `db:app:generate`).
5. Garantir snapshot/backup do staging antes de aplicar.
6. Confirmar que `USE_FIFO_MOVEMENTS_ENGINE` permanece OFF em staging até validação completa.
7. Validar as variáveis de ambiente relacionadas ao DB:
   - Verificar que `DATABASE_STAGING` e `DATABASE_TEST` estão definidos como nomes de banco (placeholders) e documentados.
   - Confirmar que `STAGING_DATABASE_URL` aponta para o staging isolado (usar secrets do CI) e `TEST_DATABASE_URL` aponta para o DB de testes/integration.
   - Nunca usar `DATABASE_URL` para executar `test:integration` ou migrations quando for ambíguo; preferir `STAGING_DATABASE_URL` ou `TEST_DATABASE_URL` explicitamente.

Passo-a-passo controlado (sem execução automática neste documento):
A. Preparação

1. Confirmar `STAGING_DATABASE_URL` nas secrets do ambiente de staging.
2. Criar snapshot/backup do DB de staging (procedimento da infra/DBA).
3. Garantir que ninguém esteja rodando cargas em staging que possam conflitar.

B. Aplicação controlada (aplicar somente com autorização explícita)

1. `npm run db:app:migrate -- --env STAGING` (ou usar `drizzle-kit migrate --config=drizzle.app.config.ts` apontando para `STAGING_DATABASE_URL`).
2. Registrar horário e commit relacionado.
3. Validar tabelas/colunas criadas:
   - `SELECT count(*) FROM information_schema.tables WHERE table_name IN ('mile_point_lots');`
   - Conferir colunas auxiliares em `mile_entries` e `mile_transfers`.
4. Rodar os checks de constraints (ex.: inserir dados de teste) em transação controlada e reverter.

C. Validação funcional

1. Executar testes de integração contra staging:
   - `npm run test:integration` (APENAS após confirmação que `STAGING_DATABASE_URL` aponta para staging isolado)
2. Testes manuais de compra/aquisição com dados demo (sem afectar produção): criar compra e verificar `mile_entries` e `mile_point_lots`.
3. Testar rollback real: forçar erro dentro de transação que executa `createPurchaseAction` + `acquireMilesUseCase` e confirmar que nenhum dado foi gravado.

D. Critérios para ativar `USE_FIFO_MOVEMENTS_ENGINE` em staging

- Migração aplicada com sucesso e sem erros de schema.
- Testes de integração passando (incl. rollback test).
- QA de compra/aquisição aprovada (evidências registradas).
- Plano de reversão testado e validado.

E. Reversão

- Caso seja necessário reverter, usar backup/snapshot para restaurar staging.
- Registrar tempo de restauração e impactos.

Preflight obrigatório antes da migration

Antes de qualquer tentativa de aplicar a migration em staging, executar o preflight para validar identidade do DB e evitar ambiguidades:

- `npm run db:preflight:staging` — valida `STAGING_DATABASE_URL`
- `npm run db:preflight:test` — valida `TEST_DATABASE_URL`

Se os scripts não estiverem disponíveis, executar o comando manual equivalente utilizando `psql` ou `pg` client, garantindo que apenas `STAGING_DATABASE_URL` / `TEST_DATABASE_URL` sejam usados explicitamente.

Critérios adicionais para avançar para migration:

- `current_database()` corresponde ao banco esperado;
- target não é produção;
- conexão usa `STAGING_DATABASE_URL`;
- `TEST_DATABASE_URL` está separado;
- backup/snapshot confirmado;
- responsável pela execução identificado;
- autorização explícita recebida.

Registro de execução (2026-05-20):

- Tentativa de preflight executada localmente em `staging` e `test`.
- Resultado: falha de interpretação da string de conexão (`ERR_INVALID_URL`).
- A falha indica necessidade de revisão das variáveis `STAGING_DATABASE_URL` / `TEST_DATABASE_URL` no ambiente/secret store — ajustar formato para um URL Postgres válido antes de reexecutar o preflight.

Registro subsequente (2026-05-20) — preflight reexecutado após correção:

- `npm run db:preflight:staging` — **OK** (mascarado): host `72.60.143.***`, database `staging_db`, user `p***s`, `current_database()`: `staging_db`, `current_user()`: `postgres`, versão: `PostgreSQL 17.6 (...)`, public tables (sample): `[]`.
- `npm run db:preflight:test` — **OK** (mascarado): host `72.60.143.***`, database `test_db`, user `p***s`, `current_database()`: `test_db`, `current_user()`: `postgres`, versão: `PostgreSQL 17.6 (...)`, public tables (sample): `[]`.

Observações:

- Ambos os bancos retornaram identidade correta e são distintos (`staging_db` vs `test_db`).
- Não houve escrita, migration ou seed executados pelo preflight.
- Próximo passo: confirmar snapshot/backup e autorização explícita antes de aplicar qualquer migration em staging.

Registros e evidências a manter

- Branch e commit usados
- Output das validações (test/typecheck/lint/build)
- Logs de migration (sem expor secrets)
- Resultado dos testes de integração
- Screenshots / outputs de QA (sanitizados)

Notas de segurança

- Nunca executar migrations em produção sem autorização explícita.
- Nunca armazenar ou commitar credenciais no repositório.
- Usar secrets do CI (GitHub Secrets / Vault) para `STAGING_DATABASE_URL`.

Critérios de sucesso

- Migração aplicada em staging com validações passando e rollback testado.
- Documento de decisão para ativar `USE_FIFO_MOVEMENTS_ENGINE` assinado pelo time.

Próximo passo recomendado após validação: ativar flag em staging para um período controlado e monitorar telemetria por 24-48 horas antes de planejar rollout em produção.

Registro de aplicação (2026-05-20) — tentativa de aplicação em staging:

- A tentativa de aplicar `db/app/migrations/0001_add_mile_point_lots.sql` foi iniciada usando o script controlado `scripts/apply-staging-migration.ts`.
- Resultado: falha ao executar o SQL devido a dependência ausente — `relation "public.mile_entries" does not exist`.
- Interpretação: a migration pressupõe existência de tabelas auxiliares que não estão presentes no staging vazio. Por segurança, a execução foi abortada e não houve alterações no banco.

Ações recomendadas após a falha:

- Aplicar migrations base que criam `mile_entries`, `program_accounts` e demais dependências, ou
- Ajustar a migration para tornar criação de índices/constraints condicional à existência das tabelas (ex.: testar `pg_catalog.pg_class`), ou
- Provisionar staging com esquema base antes de aplicar apenas esta migration.

Scripts criados (2026-05-20) — revisão/execução futura

- `scripts/apply-staging-base-migrations.ts` — runner controlado que aplica explicitamente as migrations base listadas (interna: `db/app/migrations/0000_misty_kulan_gath.sql`). Executa cada arquivo em transação, verifica current_database(), e faz varredura por comandos destrutivos antes de executar. NÃO EXECUTAR sem autorização explícita.
- `scripts/validate-staging-base-schema.ts` — validador read-only que verifica existência de `program_accounts`, `mile_entries`, `mile_transfers` e colunas chave via `information_schema`.
- `scripts/validate-staging-ledger-migration.ts` — validador read-only para os artefatos que `0001_add_mile_point_lots.sql` criaria (tabelas e índices principais).

Entradas de `package.json` adicionadas (local):

- `db:migrate:staging:base` -> `tsx scripts/apply-staging-base-migrations.ts`
- `db:validate:staging:base` -> `tsx scripts/validate-staging-base-schema.ts`
- `db:validate:staging:ledger` -> `tsx scripts/validate-staging-ledger-migration.ts`

Observação operacional: os scripts foram adicionados à branch `1.3.24.1-staging-base-schema` mas **não foram executados**. Próxima etapa é revisar/autorizar execução conforme plano.
