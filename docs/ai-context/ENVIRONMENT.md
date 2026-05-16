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
