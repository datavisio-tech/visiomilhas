# PURCHASES_BUSINESS_RULES

## Regra oficial

Uma Compra Bonificada em `RECEIVED` representa a entrada operacional de pontos na Conta Operacional. A contabilização só é considerada correta quando estes três passos acontecem na mesma transação:

1. criar `mile_entries` com `PURCHASE_BONUS`
2. criar `mile_point_lots` com `sourceEntryId = entry.id`
3. atualizar `program_accounts.currentPointsBalance`

## Fluxo `RECEIVED`

- Executado dentro de uma transação única.
- O ponto de entrada é o `purchase_records` da compra.
- O `program_id` é derivado da conta operacional, nunca digitado manualmente pelo operador.
- O bônus deve gerar um lote FIFO disponível com `remainingPoints = points`.
- O saldo da conta operacional deve subir exatamente pelo mesmo valor do lote.

## Fluxo de reversão

Quando a compra sai de `RECEIVED` para `PROBLEM` ou `APPROVED`:

- criar `PURCHASE_REVERSAL`
- marcar a entry original como reversed
- fechar o lote originado pelo bônus
- reduzir `program_accounts.currentPointsBalance` pelo mesmo valor anteriormente creditado

Quando a compra volta de `PROBLEM` para `RECEIVED`:

- restaurar a entry original
- reabrir o lote FIFO original
- restaurar o saldo da conta operacional

## Idempotência

- `RECEIVED -> RECEIVED` não cria entrada, lote ou saldo duplicado.
- `RECEIVED -> PROBLEM -> RECEIVED` restaura o estado contábil sem romper o vínculo histórico.
- A entry bônus continua sendo rastreável por `related_entity_type = 'purchase_record'`.

## Impactos downstream

- `Transfers`: passam a consumir saldo real da conta operacional.
- `Sales`: passam a consumir lotes efetivamente disponíveis.
- `FIFO Engine`: passa a operar sobre `mile_point_lots` consistentes.
- `Forecast Engine`: passa a enxergar saldo e lotes como fonte confiável.
- `Resultado Operacional`: passa a refletir o ledger operacional real.

## Validação

A validação oficial do módulo deve cobrir:

- `mile_entries`
- `mile_point_lots`
- `program_accounts.currentPointsBalance`
- reversão para `PROBLEM`
- restauração para `RECEIVED`
- idempotência de reexecução
