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
- Para o QA manual de compra FIFO em staging, a ativação deve ser explícita, temporária e acompanhada por registro de horário e responsável.
- O fluxo de validação read-only pós-compra usa `npm run db:validate:staging:purchase-fifo` com `STAGING_DATABASE_URL` apenas.

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

Nota operacional: o CI do repositório requer que o secret `TEST_DATABASE_URL` seja configurado no GitHub (apontando para um DB de teste isolado). Não use `DATABASE_URL` ou `STAGING_DATABASE_URL` para esse propósito.

# ENVIRONMENT - variáveis de ambiente e ambientes

## Status operacional

- O GitHub Environment `production` já foi criado pelo operador.
- As secrets de production já foram cadastradas no Environment `production`.
- Não imprimir, registrar em log ou versionar valores reais de secrets.
- `.env.production` remoto deve receber `chmod 600` após ser gerado no servidor.

## Ambiente local

- `.env.example`: somente placeholders seguros e exemplos públicos, sem valores reais.
- `.env.local`: arquivo local de desenvolvimento, não commitado.
- `APP_DATABASE_URL`: conexão do runtime local para a base da aplicação.
- `DATABASE_URL`: não usar como fallback silencioso para staging, test ou production.

## Ambiente de staging

- `STAGING_DATABASE_URL`: base isolada para QA e validação read-only.
- `TEST_DATABASE_URL`: base isolada para testes automatizados de integração.
- `USE_FIFO_MOVEMENTS_ENGINE`: pode ser ativada explicitamente em staging quando houver validação e autorização.

## Ambiente de production

- `environment: production` deve ser usado no workflow final de deploy.
- O workflow de produção deve gerar `.env.production` no servidor a partir das Environment Secrets.
- `USE_FIFO_MOVEMENTS_ENGINE=0` é o estado inicial da produção.
- O deploy deve reutilizar o Traefik existente após auditoria prévia.
- O deploy final deve acontecer via GitHub Actions com o usuário SSH `gitdatavisiodeploy`.

## Nomes esperados de secrets em production

Os valores abaixo devem existir no GitHub Environment `production`, sem serem expostos em documentação operacional fora dos nomes.

- `APP_URL`
- `NEXT_PUBLIC_APP_URL`
- `APP_DATABASE_URL`
- `ADM_DATABASE_URL`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `SAAS_DB`
- `APP_DB`
- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SSH_HOST`
- `SSH_USER`
- `SSH_PRIVATE_KEY`

## Regras operacionais

- Nunca imprimir secrets em logs, documentação ou saída de scripts.
- Nunca commitar `.env.production`.
- Nunca usar `DATABASE_URL` como substituto implícito para `APP_DATABASE_URL`, `STAGING_DATABASE_URL` ou `TEST_DATABASE_URL`.
- `APP_URL` e `NEXT_PUBLIC_APP_URL` devem apontar para o domínio público da aplicação em production.
- `STAGING_DATABASE_URL` e `TEST_DATABASE_URL` nunca devem apontar para produção.
- `npm run test:integration` deve continuar restrito ao banco de teste isolado.

## Deploy remoto

- O diretório remoto esperado é `/opt/datavisio/visiomilhas`.
- O usuário SSH de deploy é `gitdatavisiodeploy`.
- O workflow de deploy deve gerar `.env.production` no host remoto e aplicar permissões restritas.
- Antes do primeiro deploy, auditar Docker, Docker Compose/Swarm, Portainer e Traefik existentes.

## Fluxo de migrações e seeds

- Usar `drizzle.adm.config.ts` e `drizzle.app.config.ts` para separar migrações ADM e APP.
- Fluxo preferencial: `generate` -> `migrate`.
- `drizzle-kit push` não é o fluxo recomendado.
- Seeds só podem ser executados com autorização explícita.

## Resumo de diferenças entre arquivos de ambiente

- `.env.example`: documentação de nomes e placeholders seguros.
- `.env.local`: desenvolvimento local, não versionado.
- `.env.production`: gerado no servidor durante deploy, não versionado.
- `STAGING_DATABASE_URL`: staging isolado.
- `TEST_DATABASE_URL`: teste isolado.
- `APP_DATABASE_URL`: runtime da aplicação fora do staging/test.
