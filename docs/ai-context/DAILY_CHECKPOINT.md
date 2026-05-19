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
