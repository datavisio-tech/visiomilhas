# STAGING QA — Compra FIFO (1.3.26)

Objetivo

- Validar a compra/aquisição de milhas em `staging` com o motor FIFO ativado (`USE_FIFO_MOVEMENTS_ENGINE=1`) apenas em staging.

Pré-condições

- `STAGING_DATABASE_URL` configurado no host que executará os testes (não commitar `.env`).
- Schema `base` e `ledger` aplicados e validados em staging.
- Usuário/conta de teste disponível e dados de teste não sensíveis.
- `USE_FIFO_MOVEMENTS_ENGINE=1` configurado apenas no ambiente `staging` (não em production).

Checklist de execução (operador)

1.  Confirmar preflight e validações:
    - `npm run db:preflight:staging` → `current_database()` = staging_db
    - `npm run db:validate:staging:base`
    - `npm run db:validate:staging:ledger`

2.  Reproduzir Cenário 1 — Compra simples (FIFO ON):
    - Acesse UI de compra em staging.
    - Realizar compra de teste com valores fictícios.
    - Verificar, via script read-only ou queries seguras:
      - `mile_entries` contém novo registro (retornar `id`, `account_id`, `points_acquired` apenas)
      - `mile_point_lots` contém lote criado (retornar `id`, `account_id`, `remaining_points`)
      - `program_accounts.current_points_balance` atualizado (retornar `account_id`, `current_points_balance`)
      - `source_entry_id` referenciado corretamente no `mile_point_lots` ou `mile_entries`

3.  Cenário 2 — Fallback (FIFO OFF):
    - Validar fluxo legado com `USE_FIFO_MOVEMENTS_ENGINE=0` em ambiente controlado (ou documentar como execução manual se não for seguro alternar flag no mesmo staging).

4.  Cenário 3 — Rollback controlado:
    - Se possível simular falha controlada para validar rollback (sem impactar dados reais). Caso contrário, não executar e marcar como "covered by CI".

5.  Cenário 4 — Não regressão visual:
    - Validar UI de compra: formulário funciona, mensagens aparecem, listagem/saldo atualiza.

Critérios de aceite

- Registros e lotes criados conforme esperado (IDs e contagens).
- Saldo do `program_accounts` refletindo a aquisição.
- Nenhum dado sensível exposto nos logs.
- `USE_FIFO_MOVEMENTS_ENGINE` ativo apenas em staging; produção permanece OFF.

Notas de segurança

- Não executar seeds.
- Não expor connection strings completas.
- Fazer backup/snapshot de staging antes de qualquer ação destrutiva (se aplicável).
