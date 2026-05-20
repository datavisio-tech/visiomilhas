# CHECKPOINT - Encerramento do dia — 1.3.21

Data: 2026-05-18

- Versão atual: 1.3.21
- Branch atual: 1.3.21-tests-purchase-fifo
- Último commit: 0716bf2 — test(purchases): unit tests for createPurchaseAction covering FIFO flag and rollback 1.3.21

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
