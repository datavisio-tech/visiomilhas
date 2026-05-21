# STAGING QA — Compra FIFO (1.3.26)

## 1.3.26.3 — Validação de runtime da página de compras

Objetivo

- Validar o runtime da página de compras antes de reativar o QA FIFO em staging.

Resultado local

- A rota `/app/purchases` abriu normalmente em dev local.
- O erro `Cannot redefine property: $$id` não apareceu na abertura da página.
- Nenhuma compra de teste foi executada.
- `USE_FIFO_MOVEMENTS_ENGINE` permaneceu OFF.
- `.claude/` continua não rastreado e fora de commit.

Validações executadas

- `npm run test` — OK.
- `npm run typecheck` — OK.
- `npm run lint` — OK.
- `npm run build` — OK.

Próxima etapa

- Aguardar autorização explícita para retomar o roteiro de QA em staging com a flag FIFO reativada.

## 1.3.26.1 — Preparação do QA manual

Objetivo

- Validar a compra/aquisição de milhas em `staging` com o motor FIFO ativado (`USE_FIFO_MOVEMENTS_ENGINE=1`) apenas em staging.

Pré-condições

- `STAGING_DATABASE_URL` configurado no host que executará os testes (não commitar `.env`).
- Schema `base` e `ledger` aplicados e validados em staging.
- Usuário/conta de teste disponível e dados de teste não sensíveis.
- `USE_FIFO_MOVEMENTS_ENGINE=1` configurado apenas no ambiente `staging` (não em production).
- Antes de ativar a flag, registrar horário aproximado e responsável pela execução.

Dados/identificadores que o operador precisa anotar

- `accountId` da conta usada na compra.
- `programId` da conta ou programa exibido na UI.
- `purchaseId`, se a tela exibir o identificador.
- `entryId`, se a UI ou a grade de extrato exibir o identificador da entrada criada.
- Quantidade de pontos comprados.
- Valor total em centavos ou moeda exibido na tela.

Checklist de execução (operador)

1.  Confirmar preflight e validações:
    - `npm run db:preflight:staging` → `current_database()` = staging_db
    - `npm run db:validate:staging:base`
    - `npm run db:validate:staging:ledger`

2.  Ativar a flag somente em staging:
    - Configurar `USE_FIFO_MOVEMENTS_ENGINE=1` no ambiente de staging.
    - Reiniciar ou recarregar a aplicação de staging conforme o processo operacional local.
    - Confirmar que produção permanece com `USE_FIFO_MOVEMENTS_ENGINE=0`.
    - Registrar o horário aproximado da ativação e o responsável.

3.  Reproduzir Cenário 1 — Compra simples (FIFO ON):
    - Acesse UI de compra em staging.
    - Realizar compra de teste com valores fictícios.
    - Verificar, via script read-only ou queries seguras:
      - `mile_entries` contém novo registro (retornar `id`, `account_id`, `points_acquired` apenas)
      - `mile_point_lots` contém lote criado (retornar `id`, `account_id`, `remaining_points`)
      - `program_accounts.current_points_balance` atualizado (retornar `account_id`, `current_points_balance`)
      - `source_entry_id` referenciado corretamente no `mile_point_lots` ou `mile_entries`
    - Se houver `accountId`, executar:
      - `npm run db:validate:staging:purchase-fifo -- --account-id <accountId>`
    - Se houver `entryId`, executar:
      - `npm run db:validate:staging:purchase-fifo -- --account-id <accountId> --entry-id <entryId>`

4.  Conferências esperadas da compra:
    - `mile_entries` criado com a compra.
    - `mile_point_lots` criado com o lote da compra.
    - `remaining_points` igual aos pontos adquiridos no cenário simples.
    - `program_accounts.current_points_balance` refletindo a aquisição.
    - Vínculo de origem preservado via `source_entry_id` quando aplicável.

5.  Cenário 2 — Fallback (FIFO OFF):
    - Validar fluxo legado com `USE_FIFO_MOVEMENTS_ENGINE=0` em ambiente controlado (ou documentar como execução manual se não for seguro alternar flag no mesmo staging).

6.  Cenário 3 — Rollback controlado:
    - Se possível simular falha controlada para validar rollback (sem impactar dados reais). Caso contrário, não executar e marcar como "covered by CI".
    - Em caso de falha, desligar a flag em staging (`USE_FIFO_MOVEMENTS_ENGINE=0`) e reiniciar/recarregar a aplicação.
    - Registrar erro sanitizado e abrir etapa de correção.

7.  Cenário 4 — Não regressão visual:
    - Validar UI de compra: formulário funciona, mensagens aparecem, listagem/saldo atualiza.

8.  Encerramento do teste:
    - Confirmar que a flag voltou para `0` se o QA for encerrado.
    - Registrar resultado final: sucesso ou erro.

Critérios de aceite

- Registros e lotes criados conforme esperado (IDs e contagens).
- Saldo do `program_accounts` refletindo a aquisição.
- Nenhum dado sensível exposto nos logs.
- `USE_FIFO_MOVEMENTS_ENGINE` ativo apenas em staging; produção permanece OFF.
- QA manual executado com identificadores anotados e validação read-only concluída.

Notas de segurança

- Não executar seeds.
- Não expor connection strings completas.
- Fazer backup/snapshot de staging antes de qualquer ação destrutiva (se aplicável).
- Não alterar `.env` real nem `.env.example` para ativar a flag.
- Não usar `DATABASE_URL` ou `TEST_DATABASE_URL` para staging.
