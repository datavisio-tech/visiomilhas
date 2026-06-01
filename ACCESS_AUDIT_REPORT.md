# ACCESS_AUDIT_REPORT

Resumo dos testes de validação do fluxo "Nova Compra Bonificada".

Formato:

- Data: YYYY-MM-DD HH:MM
- Conta selecionada: <displayName> (account_id = <id>)
- Programa esperado: <nome> (program_id = <id>)
- Programa preenchido pela UI: <nome> (program_id = <id>)
- Resultado do POST /api/purchases/create: status / payload / id criado
- Observações: <qualquer discrepância ou ação tomada>

Regra verificada: ao selecionar `Conta Destino` o frontend preenche automaticamente `Programa` e o backend infere `programId` a partir da conta; não é permitido program distinto da conta.

## Auditoria de contabilização Purchases

- A entry `PURCHASE_BONUS` agora persiste `related_entity_type` e `related_entity_id`.
- O recebimento operacional cria lote FIFO e atualiza saldo na mesma transação.
- A reversão fecha o lote e a volta de `PROBLEM -> RECEIVED` restaura o estado contábil.
- Validação automatizada: `tests/integration/purchases.accounting.test.ts` passou.

--

Use este arquivo para registrar manualmente o resultado dos testes ou para colar saídas de logs/DB quando necessário.
