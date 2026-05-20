# ENVIRONMENT - Variáveis de ambiente (placeholders)

// Variáveis principais de banco e aplicação
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
POSTGRES_HOST=HOST
POSTGRES_PORT=5432
POSTGRES_USER=USER
POSTGRES_PASSWORD=PASSWORD
POSTGRES_DB=DATABASE

// Bases separadas (administrativa e aplicação)
ADM_DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/controle_adm_saas_datavisio
APP_DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/visiomilhas_app

// Admin connection used to create databases if they don't exist
// Should point to an existing database (eg. 'postgres' or 'template1') and
// the user must have CREATE DATABASE permission. Sensitive — keep in .env or
// secrets store, do not expose to client.
POSTGRES_ADMIN_DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/postgres

// Auth / OAuth
AUTH_SECRET=CHANGE_ME
GOOGLE_CLIENT_ID=CHANGE_ME
GOOGLE_CLIENT_SECRET=CHANGE_ME

// Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_CHANGE_ME
STRIPE_SECRET_KEY=sk_test_CHANGE_ME
STRIPE_WEBHOOK_SECRET=whsec_CHANGE_ME

// URLs
APP_URL=https://visiomilhas.visiochat.cloud
NEXT_PUBLIC_APP_URL=https://visiomilhas.visiochat.cloud

// Application
APP_NAME=VisioMilhas

// Feature flags

## Feature flags

### USE_FIFO_MOVEMENTS_ENGINE

Controla se rotas/actions operacionais devem usar o motor FIFO de movimentações (`movements.use-cases`) ou manter o fluxo legado.

- Default seguro: desativado (`0`).
- Valores considerados ativos: `1`, `true`, `on`.
- Comparação: ignorar maiúsculas/minúsculas e espaços antes/depois do valor.
- Quando ausente, vazio, inválido ou diferente dos valores aceitos, o sistema mantém o fluxo legado.
- Não é secret e deve constar em `.env.example` com valor seguro `0`.
- Só deve ser ativado após validação da migration de ledger/lotes e testes em ambiente isolado.

// Deploy / CI
SSH_HOST=CHANGE_ME
SSH_USER=CHANGE_ME
SSH_PRIVATE_KEY=CHANGE_ME
APP_ENV=production

// MongoDB (reservado para fases futuras - logs/eventos/IA)
MONGODB_URI=mongodb://USER:PASSWORD@HOST:PORT/DATABASE
MONGODB_USER=USER
MONGODB_USER_PASSWORD=PASSWORD
MONGODB_DATABASE=visiomilhas_logs
MONGODB_SERVER_IP=HOST

Observações:

- Nunca comitar `.env` real. Use `.env.example` com os mesmos nomes sem valores.
- Prefixos `NEXT_PUBLIC_` somente para variáveis públicas.

## Staging / Test databases

Para operações de validação de migrations e testes de integração, use variáveis de ambiente dedicadas apontando para bases isoladas (staging/test). Não usar variáveis de produção.

- `STAGING_DATABASE_URL`: apontar para o banco de staging isolado usado para validação segura de migrations e QA.
- `TEST_DATABASE_URL`: opcional, para runners de teste que requeiram DB separado.

Regras:

- Nunca apontar `STAGING_DATABASE_URL` para um banco de produção.
- `npm run test:integration` só deve ser executado após confirmação explícita de que `STAGING_DATABASE_URL` aponta para um DB isolado e que backups/snapshots foram feitos.
- Não documentar secrets reais nos arquivos de documentação; use `.env.example` com placeholders e armazene secrets em cofre (GitHub Secrets, Vault).

Operação de migrações e seeds:

- Use `drizzle.adm.config.ts` e `drizzle.app.config.ts` para gerar e aplicar migrações separadas.
- Fluxo principal: `generate` -> `migrate` (não usar `push` como padrão).
- Scripts disponíveis (padrão DataVisio):
  - `npm run db:adm:generate` — gerar migração ADM
  - `npm run db:app:generate` — gerar migração APP
  - `npm run db:adm:migrate` — aplicar migração ADM
  - `npm run db:app:migrate` — aplicar migração APP
  - `npm run db:generate` — gera ambas (ADM + APP)
  - `npm run db:migrate` — aplica ambas (ADM + APP)
  - `npm run db:check-env` — verifica presença segura das variáveis necessárias
  - `npm run db:seed` — executa `db/seed/index.ts` (REquer autorização explícita, veja `db/seed/index.ts`)
- Verifique `ADM_DATABASE_URL` e `APP_DATABASE_URL` antes de executar migrações/seeds. Nunca imprima valores de conexão em logs.

Observação: `drizzle-kit push` NÃO é o fluxo recomendado aqui; prefira gerar migrações e aplicar com `drizzle-kit migrate` para controle do histórico e revisão de mudanças.
