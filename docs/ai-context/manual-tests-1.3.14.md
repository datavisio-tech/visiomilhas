Manual tests (resumo) — 1.3.14

Este arquivo documenta passos de teste manuais usados durante desenvolvimento. Não contém segredos.

Objetivo

- Testar endpoints locais de compras, vendas e transferências em `http://localhost:3000`.

Passos resumidos

1. Preparar ambiente local: `npm run dev` e garantir que o backend esteja escutando em `localhost:3000`.
2. Criar compra: enviar `POST /api/purchases` com `accountId`, `points`, `totalCostCents`, `purchasedAt`.
3. Validar saldo via `lib/data/accounts.getAccountsOverview()` ou pela UI de contas.
4. Criar venda: `POST /api/sales` com `accountId`, `points`, `totalAmountCents`.
5. Tentar venda com saldo insuficiente para confirmar resposta de erro.
6. Criar transferência: `POST /api/transfers` com `fromAccountId`, `toAccountId`, `pointsSent`, `transferredAt`.

Observações

- Este documento substitui o script `scripts/manual-tests.ts` (que foi convertido para documentação). Não execute o script diretamente em ambientes com dados reais.
- Não inclua credenciais ou URLs sensíveis neste arquivo.

Recomendações

- Use dados de desenvolvimento/espaço isolado para testes.
- Para testes automáticos, prefira as suítes unitárias/in-memory descritas em `lib/services/__tests__`.
