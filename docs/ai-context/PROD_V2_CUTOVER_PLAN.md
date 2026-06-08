# PROD V2 Cutover Plan

**Status:** PROD_V2_CUTOVER_READY

## Objetivo
Planejar o primeiro go-live do PostgreSQL Production V2 com banco vazio, sem migração de dados de DEV/HM.

## Base revisada
- `scripts/bootstrap-production-v2.ts`
- `db/adm/migrations/0001_better_auth_tables.sql`
- `db/adm/migrations/0000_strange_thor_girl.sql`
- `db/app/migrations/0000_misty_kulan_gath.sql`
- `db/app/migrations/0001_add_mile_point_lots.sql`

## Premissas
- O banco de produção V2 nasce vazio.
- Não há herança de dados de DEV/HM.
- A autenticação usa Better Auth com bootstrap explícito.
- DEV OAuth remains local-only and does not use GitHub environments.
- HM and PROD share the same Google OAuth client and the same shared Better Auth secret.
- O cutover não executa seeds automáticos de demo.
- O primeiro owner, a primeira organização e o primeiro trial nascem pelo fluxo runtime/onboarding.

## Pré-cutover
1. Provisionar `controle_adm_saas_datavisio` e `visiomilhas_app` no PostgreSQL Production V2.
2. Confirmar `ADM_DATABASE_URL` e `APP_DATABASE_URL` apontando para os bancos corretos.
3. Confirmar `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` válidos no shared HM/PROD OAuth client.
4. Confirmar DNS, Traefik e TLS da URL de produção.
5. Confirmar que o workflow de produção está apontando para `main`.
6. Confirmar que o bootstrap de produção V2 permanece planning-only até o go-live autorizado.

## Bootstrap
### Ordem recomendada
1. Executar as migrations do ADM.
2. Executar a migration do Better Auth.
3. Executar as migrations do APP.
4. Executar a migration adicional de lots/FIFO se o fluxo de pontos precisar dela.
5. Subir a aplicação com os ambientes corretos.
6. Validar o bootstrap de auth.
7. Criar o primeiro owner via fluxo de login/onboarding.
8. Criar a primeira organização.
9. Criar a conta/programa padrão.
10. Ativar o primeiro trial.

### Regras do bootstrap
- Não usar seeds de demo para produção real.
- Não copiar dados de DEV/HM.
- Não ativar billing automatizado antes do primeiro fluxo funcional.

## Validação
1. Healthcheck do container.
2. Auth bootstrap sem `AUTH_BOOTSTRAP_FAILED`.
3. Google OAuth bootstrap funcionando.
4. `DOCTYPE` presente nas respostas públicas.
5. Rotas públicas e autenticadas respondendo.
6. Sessão criada com sucesso no primeiro login.
7. Onboarding concluído.
8. Acesso a `subscribe`, `accounts`, `programs` e `purchases`.
9. Conectividade com `ADM_DATABASE_URL` e `APP_DATABASE_URL`.

## Rollback
1. Reverter para a última imagem estável.
2. Redirecionar o deploy para o SHA anterior.
 - Execute the prepared migration script `scripts/prod_v2_apply_bootstrap_and_ledger.sh` under supervision.
	 - NOTE: the script now runs PostgreSQL client operations inside the `postgres_prod_v2` container using `docker exec`.
	 - The script copies migration files into the container, creates a pre-migration dump inside the container, and copies the dump to the host for safekeeping.

## Riscos
- Better Auth falhar em banco vazio se a migration não estiver aplicada corretamente.
- Primeiro login falhar se o Google OAuth Console não estiver com os redirect URIs autorizados.
- Divergência entre `ADM_DATABASE_URL` e `APP_DATABASE_URL`.
- App subir com banco vazio sem bootstrap runtime completo.
- Possível drift entre HM e PROD se secrets ou workflow forem reaproveitados incorretamente.

## Tempo estimado
- Preparação de ambiente e revisão final: 30 a 60 minutos
- Cutover técnico com validação: 30 a 60 minutos
- Bootstrap do primeiro usuário e conferências funcionais: 20 a 40 minutos
- Janela total recomendada: 1 h 30 min a 2 h 40 min

## Validação obrigatória da migration APP 0001

**Status atual:** validada operacionalmente em HM; pendente em PROD V2.

Antes de liberar o cutover, aplicar `db/app/migrations/0001_add_mile_point_lots.sql` no APP database PROD V2 e executar validação read-only confirmando:

| Objeto | Resultado exigido |
|---|---|
| `mile_point_lots` | FOUND |
| `mile_entries.consumed_lot_id` | FOUND |
| `mile_entries.consumed_points` | FOUND |
| `mile_entries.lot_snapshot` | FOUND |
| `mile_transfers.source_entry_id` | FOUND |
| `mile_transfers.destination_entry_id` | FOUND |
| `idx_mpl_account_remaining` | FOUND |
| `idx_mpl_source_entry` | FOUND |
| `idx_me_account_occurred` | FOUND |
| `idx_mt_source_dest` | FOUND |
| `fk_mpl_account` | FOUND |
| `chk_mpl_acquired_positive` | FOUND |

Critério de liberação:

- `MIGRATION OK`: todos os objetos acima retornam `FOUND` no APP database PROD V2.
- `CUTOVER LIBERADO`: `MIGRATION OK` + backup/snapshot confirmado + smoke PROD aprovado.
- `NO-GO`: qualquer objeto retorna `MISSING` ou a validação PROD V2 não pode ser executada.