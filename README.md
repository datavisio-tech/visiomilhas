# VisioMilhas - MVP1

Projeto: VisioMilhas
Empresa: DataVisio

Descrição resumida:
Plataforma SaaS para gestão de milhas/pontos de fidelidade com multi-tenant por organização.

Stack:

- Frontend: Next.js (App Router)
- Language: TypeScript
- UI: Tailwind CSS
- ORM: Drizzle ORM (Postgres)

Arquitetura de banco:

- ADM database: controle_adm_saas_datavisio
- APP database: visiomilhas_app
- Observação: usam-se duas databases separadas (ADM / APP) — não consolidar em um único DB com schemas.

Versão operacional atual: 1.3.14

Status do MVP1:

- Técnico / base: 81%–85%
- Utilizável por usuário: 60%–68%

Comandos principais:

```
npm run dev
npm run build
npm run test
npm run lint
npm run typecheck
npm run db:check-env
npm run db:check-connections
npm run db:seed (exige autorização explícita)
```

Status das validações (local):

- `npm run test`: OK (14 testes unitários do domínio)
- `npm run typecheck`: OK
- `npm run lint`: OK
- `npm run build`: OK

Próximos passos (curto prazo):

- Conectar `/app/entries` ao banco real (1.2.4)
- Conectar compras/vendas/transferências e CRUDs (1.2.5+)
- Implementar autenticação e deploy

Preparação 1.3.15:

- Objetivo: alinhar `db/app/schema.ts` com a migration proposta (`0001_add_mile_point_lots.sql`) e preparar o contrato `MovementsRepo` para implementação Drizzle (transações). Não aplicar migration nesta etapa.

Passos iniciais para rodar local:

1. Preencher `.env.local` com as variáveis em `.env.example` (NÃO commitar `.env.local`).
2. Rodar `npm ci`.
3. `npm run dev`.

Observações de segurança:

- Não versionar `.env`.
- Não expor `APP_DATABASE_URL` / `ADM_DATABASE_URL` em logs.

Notas da versão 1.3.12 (preparação do schema para ledger/FIFO):

- Ação 1.3.12: adicionado `mile_point_lots` ao schema Drizzle (arquivo `db/app/schema.ts`) e migration proposta em `db/app/migrations/0001_add_mile_point_lots.sql`.
- Observação: a migration proposta NÃO foi aplicada — apenas commitada para revisão.
- Próximo passo: 1.3.13 — implementar motor FIFO e serviços transacionais (`lib/services/movements.ts`).
- Ação 1.3.12: adicionado `mile_point_lots` ao schema Drizzle e migration proposta criada.
- Ação 1.3.13: migration refinada com FKs, índices e checks propostos (arquivo `db/app/migrations/0001_add_mile_point_lots.sql`).
- Observação: a migration proposta continua NÃO APLICADA — apenas commitada para revisão.
- Próximo passo: 1.3.14 — implementar motor FIFO e serviços transacionais (`lib/services/movements.ts`).
- Ação 1.3.14: consolidação do motor FIFO puro/in-memory e testes unitários (`lib/services/movements.ts`, `lib/services/__tests__/movements.test.ts`). Migration permanece proposta e NÃO APLICADA.

Notas da versão 1.2.8:

- Corrigido warning ESLint em `lib/data/db-errors.ts` (remoção de export default anônimo).
- `/app/clubs` agora consulta `mile_clubs` no APP DB via `lib/data/clubs.ts` (Server Component, fallback seguro quando tabela ausente).
- `/app/settings` revisado para indicar tela preparatória sem persistência.
- Mantida separação: `organizations` resolvido via ADM; produto via APP.
- Recomenda-se remover fallbacks de desenvolvimento antes do deploy de produção.

Módulos conectados ao banco real:

- dashboard
- programs
- accounts
- entries
- purchases
- sales
- transfers
- clubs
