# RELEASE 4.3-B.1 — Purchases como Bonificações Futuras

Resumo das mudanças aplicadas e recomendações operacionais para o domínio `Purchases`.

Principais decisões:

- `Purchases` representa compras em parceiros que geram expectativa de pontos (não pontos imediatos).
- Estados oficiais do processo: `REGISTERED`, `DELIVERED`, `TRACKED`, `PENDING_CREDIT`, `RECEIVED`, `PROBLEM`.
- Somente quando a `Purchase` muda para `RECEIVED` o sistema cria uma movimentação contábil do tipo `PURCHASE_BONUS` relacionada a essa compra.
- A criação da movimentação é idempotente: o serviço verifica se já existe um `mile_entries` com `relatedEntityType = 'purchase_record'` e `relatedEntityId = purchaseId` antes de inserir.

Arquitetura/Implementação aplicada:

- `src/modules/purchases/application/services.ts`: transição para `RECEIVED` cria `PURCHASE_BONUS` (idempotente). Reversão agora observa transições `RECEIVED -> PROBLEM` (ou política aprovada).
- `src/modules/purchases/domain/state-machine.ts`: grafo de estados atualizado para os novos nomes e fluxo.
- `src/modules/purchases/infrastructure/drizzle-repo.ts`: default de `status` para `REGISTERED` no INSERT.
- UI: `src/modules/purchases/ui/PurchasesCockpit.client.tsx` atualizado para usar os novos nomes de status e o Kanban.
- MCP journeys/tests: atualizados para usar `PENDING_CREDIT -> RECEIVED` transição e validar idempotência.

Recomendações (não aplicadas automaticamente):

- Criar migration que adicione UNIQUE INDEX em `mile_entries (related_entity_type, related_entity_id)` para garantir idempotência a nível de banco.
- Verificar e, se necessário, migrar/renomear colunas `credited_at`/`credited_points` para `received_at`/`received_points` se isso deixar o modelo mais claro.
- Implementar ajuste automático do saldo e criação de lotes (`mile_point_lots`) quando a movimentação `PURCHASE_BONUS` for criada (atualização de `program_accounts.current_points_balance`).

Testes para executar após deploy local:

```
npm run lint
npm run typecheck
npm run purchases:test -- emailteste01
```

Nota: não executar migrations sem aprovação do time de banco. As mudanças de código já foram aplicadas nos arquivos do repositório.
