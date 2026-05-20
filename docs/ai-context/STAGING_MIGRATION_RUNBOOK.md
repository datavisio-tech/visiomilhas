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
