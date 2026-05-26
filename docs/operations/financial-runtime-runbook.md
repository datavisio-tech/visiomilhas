# Financial Runtime Runbook

Guia curto para operação humana do runtime financeiro do VisioMilhas.

## Objetivo

Validar replay, lineage, warnings e summaries sem depender de SQL ou leitura de logs.

## Como interpretar os summaries

- `Account summary`: compare saldo operacional e saldo conciliado. Divergência indica drift entre ledger e lotes.
- `FIFO summary`: verifique lotes problemáticos, consumo inválido e warnings ativos. Problemas aqui afetam rastreabilidade.
- `Replay summary`: confirme se o replay está válido, se a lineage está íntegra e se há inconsistências.

## Como validar replay

- Abra a inspeção da conta.
- Leia a narrativa do evento: antes, ação e depois.
- Confirme saldo anterior, impacto da operação e saldo final.
- Em venda, confirme custo FIFO e margem.
- Em transferência, confirme origem, destino e lineage simplificada.

## Como interpretar warnings

- Divergência de saldo: o saldo não fecha com os lotes. Recomendado reconciliar.
- Lote órfão: há perda de rastreabilidade. O replay pode ficar inconsistente.
- Consumo inválido: um lote pode ter sido consumido fora da sequência esperada.
- Replay inconsistente: há eventos fora de ordem, duplicados ou com delta inválido.

## Como identificar drift

- Compare saldo operacional com saldo conciliado.
- Verifique se há lotes órfãos ou consumo inválido.
- Confirme se o replay aponta para a mesma sequência operacional do ledger.

## Troubleshooting operacional

1. Localize o warning na inspeção.
2. Entenda o impacto e a operação afetada.
3. Aplique a ação sugerida: reconciliar, validar replay ou revisar lineage.
4. Escale para engenharia quando o warning persistir após a verificação local.

## Quando acionar recovery

- Quando o saldo conciliado divergir do saldo operacional após reconciliação.
- Quando o replay continuar inconsistente após validação manual.
- Quando a lineage não puder ser explicada com os eventos disponíveis.
