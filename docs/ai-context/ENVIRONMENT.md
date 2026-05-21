# ENVIRONMENT - variáveis de ambiente e ambientes

## Visão geral

- `.env.example` contém apenas placeholders seguros e serve como referência para desenvolvimento local.
- `.env.production` é gerado pelo workflow de deploy no servidor a partir das secrets do GitHub Environment `production`.
- Nunca imprimir, versionar ou registrar valores reais de secrets.
- `DATABASE_URL` não deve ser usado como fallback silencioso para `APP_DATABASE_URL`.

## Variáveis base do app

- `APP_NAME`
- `APP_URL`
- `NEXT_PUBLIC_APP_URL`
- `NODE_ENV`
- `USE_FIFO_MOVEMENTS_ENGINE`

## Variáveis base do PostgreSQL

- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `SAAS_DB`
- `APP_DB`

## Variáveis compostas do PostgreSQL

- `DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`
- `ADM_DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${SAAS_DB}`
- `APP_DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${APP_DB}`

## Variáveis base do MongoDB

- `MONGODB_SERVER_IP`
- `MONGODB_USER`
- `MONGODB_USER_PASSWORD`
- `MONGODB_DATABASE`

## Variável composta do MongoDB

- `MONGODB_URI=mongodb://${MONGODB_USER}:${MONGODB_USER_PASSWORD}@${MONGODB_SERVER_IP}/${MONGODB_DATABASE}`

## Valores e convenções do projeto

- `APP_NAME=VisioMilhas`
- `SAAS_DB=controle_adm_saas_datavisio`
- `APP_DB=visiomilhas_app`
- `MONGODB_DATABASE=datavisio`
- Em `.env.example`, `APP_URL` e `NEXT_PUBLIC_APP_URL` usam `https://example.visiochat.cloud`.
- Em produção, `APP_URL` e `NEXT_PUBLIC_APP_URL` apontam para `https://visiomilhas.visiochat.cloud`.
- Em produção, `NODE_ENV` deve ser `production` e `USE_FIFO_MOVEMENTS_ENGINE` deve permanecer `0` na primeira liberação.

## Variáveis operacionais opcionais

- `POSTGRES_ADMIN_DATABASE_URL` é usada por scripts administrativos para criar bancos quando necessário.
- `STAGING_DATABASE_NAME` e `TEST_DATABASE_NAME` podem ser usados por scripts de validação como overrides seguros.

## GitHub Environment production

- O Environment `production` já foi criado pelo operador.
- As secrets de production já estão cadastradas no Environment `production`.
- O workflow de produção deve validar presença de secrets sem imprimir valores.
- O workflow de deploy deve gerar `.env.production` no servidor e nunca commitar esse arquivo.
- `.env.production` remoto deve receber `chmod 600` após ser gerado.

## Secrets obrigatorias no Environment production

- `APP_NAME`
- `APP_URL`
- `NEXT_PUBLIC_APP_URL`
- `NODE_ENV`
- `USE_FIFO_MOVEMENTS_ENGINE`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `SAAS_DB`
- `APP_DB`
- `DATABASE_URL`
- `ADM_DATABASE_URL`
- `APP_DATABASE_URL`
- `MONGODB_SERVER_IP`
- `MONGODB_USER`
- `MONGODB_USER_PASSWORD`
- `MONGODB_DATABASE`
- `MONGODB_URI`
- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PRODUCTION_SSH_HOST`
- `PRODUCTION_SSH_PORT`
- `PRODUCTION_SSH_USER`
- `PRODUCTION_SSH_PRIVATE_KEY`

## Diferenças entre arquivos de ambiente

- `.env.example`: template seguro para desenvolvimento e revisão.
- `.env.local`: ambiente local do desenvolvedor, não versionado.
- `.env.production`: arquivo remoto gerado no deploy.
- `STAGING_DATABASE_URL`: uso controlado em staging.
- `TEST_DATABASE_URL`: uso exclusivo em testes automatizados isolados.

## Fluxo de migrações e seeds

- Usar `drizzle.adm.config.ts` e `drizzle.app.config.ts` para separar migrações ADM e APP.
- Fluxo preferencial: `generate` -> `migrate`.
- `drizzle-kit push` não é o fluxo recomendado.
- Seeds só podem ser executados com autorização explícita.
