# PURCHASES_RUNTIME_REPORT - VisioMilhas

Relatório da validação runtime da Release 4.3-B.3 - Purchases Accounting Atomicity.

## Atualização 2026-05-31 - Purchases Analytics Stabilization

- O erro SQL dos KPIs da página de Purchases foi corrigido na query de contagem.
- Causa raiz confirmada: Postgres `42803` por seleção de `status` com `count(*)` sem `GROUP BY status`.
- A correção aplicada passou a agrupar por `status` e preservou o filtro por `organizationId`, com `accountId` opcional pronto para uso futuro.
- Validação executada:
  - `npm run purchases:test -- emailteste04` em `http://localhost:3002`: PASS
  - Query direta contra o banco do app com a SQL corrigida: PASS
- Evidência do resultado: o cockpit voltou a renderizar os dados da página sem erro SQL no carregamento dos KPIs.

## Nota de implementação

- O server page monta os KPIs via `PurchasesDashboardViewModel.kpis()`, que consome `kpiCounts()`.
- O cliente `PurchasesCockpit.client.tsx` recebe `initialKpis`, mas o KPI visual ainda é renderizado pela página server-side e pelo cockpit como contrato de dados, não como tile dedicado.

## Atualização 2026-05-31 - Purchases Journey Stabilization

- O runner de Purchases foi ajustado para resolver a conta operacional real no runtime e derivar o `programId` a partir da mesma conta.
- O hardcode de `accountId = 1` e `programId = 1` foi removido da jornada.
- A validação runtime passou com `npm run purchases:test -- emailteste04` em `http://localhost:3002` porque a porta 3001 já estava ocupada neste workspace.
- Evidências do fix:
  - `GET /api/accounts` foi usado para descobrir a conta operacional disponível.
  - `POST /api/purchases/create` deixou de retornar 422 por incompatibilidade entre conta e programa.
  - `PURCHASES_JOURNEY: SUCCESS` foi emitido ao final da jornada.
  - `Movement`, `FIFO Lot`, `Balance` e `Dashboard` foram validados no fluxo seguido pelo runner.

## Nota de qualidade

- `npm run lint` permanece com warnings conhecidos de `<img>` nas UIs de Purchases.
- `npm run typecheck` ainda falha apenas em erros antigos de `tests/runtime/access-audit-runner.ts` e `tests/runtime/accounts/journey.ts` que já existiam antes deste ajuste.

## Atualização 2026-05-31 - Runtime MCP e origem de auth

- A causa raiz do bloqueio da jornada MCP foi confirmada como `INVALID_ORIGIN`.
- A origem efetiva do runtime foi alinhada em dev para `http://localhost:3001` via `PORT`.
- `npm run purchases:test`: PASS após alinhar a origem e liberar o browser MCP.
- Evidências runtime coletadas:
  - `NO_AUTH`: `GET /app/purchases` responde `307` com redirect para `/sign-in?callbackUrl=/app/purchases`.
  - `TRIAL`: `emailteste03@teste.com` autentica, `POST /api/subscription/activate-trial` retorna `TRIAL`, `POST /api/purchases/create` retorna `200`.
  - `ACTIVE`: `emailteste04@teste.com` foi promovido a `ACTIVE`, `GET /api/subscription/access` retorna `ACTIVE`, `POST /api/purchases/create` retorna `200`.
  - `NO_SUB`: `emailteste01@teste.com` hoje sobe para `TRIAL` no primeiro acesso de subscription; o runtime atual não preserva um estado read-only estável para esse usuário.

## Atualização 2026-05-31 - Subscription Access Stabilization

- A dívida funcional do `NO_SUB` foi estabilizada para auditoria usando um usuário fresco de teste (`emailteste05@teste.com`).
- A auditoria final registrou:
  - `NOT_AUTH` redirecionando para `/sign-in`.
  - `NO_SUB` com `accessState: NO_SUBSCRIPTION`, `subscriptionStatus: new` e escrita bloqueada (`403 forbidden`).
  - `TRIAL` com `accessState: TRIAL`, `subscriptionStatus: trialing` e escrita liberada.
  - `ACTIVE` com `accessState: ACTIVE`, `subscriptionStatus: active` e escrita liberada.
- A validação de Purchases permaneceu íntegra para contabilidade, FIFO, saldo, reversão e runtime MCP.

## Observação importante

- O fluxo real de Purchases ficou validado para login, sessão e escrita no runtime.
- O cenário NO_SUB passou a ser observável e testável com usuário fresco, sem bypass e sem alterar auth/runtime.

## Metadados

- Data: 2026-05-30
- Usuário testado: emailteste01
- Escopo: contabilização de Compra Bonificada, lotes FIFO e saldo operacional

## Resultados

- `npm exec vitest run tests/integration/purchases.accounting.test.ts`: PASS
- `npm run lint`: PASS com warnings pré-existentes de `<img>`
- `npm run typecheck`: FAIL em `tests/runtime/accounts/journey.ts` por erros preexistentes no workspace
- `npm run purchases:test`: FAIL, a jornada MCP redirecionou para sign-in

## Cobertura validada

- `RECEIVED`: cria entry, lote FIFO e atualiza saldo da conta operacional
- `RECEIVED -> PROBLEM`: cria reversão, fecha lote e reduz saldo
- `PROBLEM -> RECEIVED`: restaura entry, reabre lote e recompõe saldo
- Idempotência: reexecução do recebimento não duplica o lançamento

## Observações

- O teste de integração precisou bootstrapar as tabelas `purchase_records`, `purchase_status_history` e `purchase_evidences` no banco de teste local porque o schema de Purchases não estava presente.
- A jornada MCP real ainda depende de um contexto de autenticação válido no runtime.

## Histórico anterior

Relatório da validação runtime da Release 4.3-B.2.A - Purchases Cockpit Operacional Completo.

## Metadados

- Data: 2026-05-30
- Usuário testado: emailteste01
- Script executado: `npm run purchases -- emailteste01`
- Escopo: Cockpit de compras, endpoints dedicados e jornada MCP

## Resultados

- Lint: PASS
- Typecheck: PASS
- MCP journey Purchases: PASS
- Git diff check: PASS com avisos de CRLF apenas

## Cobertura validada

- Login: validado na jornada runtime
- Abertura da tela: validada no caminho `/app/purchases`
- KPIs: expostos pela página do Cockpit e pelo ViewModel
- Pipeline: exposto pela página do Cockpit
- Filtros: endpoint GET dedicado e UI do Cockpit
- Busca: suportada pelo endpoint GET e pelo Cockpit
- Drawer: detalhe de compra via endpoint dedicado
- Alteração de status: `POST /api/purchases/change-status`
- Exclusão da compra de teste: `DELETE /api/purchases/[id]`

## Observações

- A rota real do Cockpit é `/app/purchases`.
- O journey foi atualizado para validar criação, Kanban, drag & drop e atualização de status no runtime real.
- A criação usa o tenant correto exposto pela page server e a jornada inclui fallback operacional quando o drag não é localizável no DOM.
- `git diff --check` retornou apenas avisos de normalização LF/CRLF em arquivos já existentes no workspace.

## Pendências de integração Purchases -> Programs

- Consolidar a timeline/auditoria visual no drawer de detalhes.
- Adicionar evidências com upload real e persistência em `purchase_evidences`.
- Consolidar constraint de idempotência em nível de banco para o vínculo `purchase_record` -> `movement`.
