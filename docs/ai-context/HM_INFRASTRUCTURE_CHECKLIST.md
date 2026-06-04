# HM Infrastructure Checklist

**Status:** HM_INFRA_READY

## Objetivo
Preparar o ambiente de homologação `hm.visiomilhas.visiochat.cloud` sem impactar DEV ou PROD.

## Arquitetura HM
- URL: `https://hm.visiomilhas.visiochat.cloud`
- Infraestrutura reutilizada:
  - `visiomilhas_app`
  - `postgres_db`
  - `mongodb`
- Função:
  - validação funcional
  - testes MCP
  - testes OAuth
  - testes de jornada
  - validação pré-produção

## O que precisa existir para HM

### DNS
- Registro DNS apontando `hm.visiomilhas.visiochat.cloud` para o host da infraestrutura atual.

### Traefik
- Traefik ativo no host.
- Router baseado em host:
  - `Host(\`hm.visiomilhas.visiochat.cloud\`)`
- EntryPoint HTTPS:
  - `websecure`
- TLS ativo com resolver configurado.

### Certificados
- Certificado TLS válido para `hm.visiomilhas.visiochat.cloud`.
- Resolver Let's Encrypt funcional no Traefik.

### Labels Docker esperadas no serviço HM
- `traefik.enable=true`
- `traefik.docker.network=traefik_public`
- `traefik.http.routers.<service>.rule=Host(\`hm.visiomilhas.visiochat.cloud\`)`
- `traefik.http.routers.<service>.entrypoints=websecure`
- `traefik.http.routers.<service>.tls=true`
- `traefik.http.routers.<service>.tls.certresolver=le`
- `traefik.http.services.<service>.loadbalancer.server.port=3000`

### Variáveis de ambiente necessárias
- `APP_NAME`
- `APP_URL`
- `NEXT_PUBLIC_APP_URL`
- `NODE_ENV`
- `USE_FIFO_MOVEMENTS_ENGINE`
- `ADM_DATABASE_URL`
- `APP_DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `SAAS_DB`
- `APP_DB`

### Secrets GitHub necessárias
- `SSH_HOST`
- `SSH_PORT`
- `SSH_USER`
- `SSH_PRIVATE_KEY`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ADM_DATABASE_URL`
- `APP_DATABASE_URL`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`

## Verificação de alinhamento dos workflows

### `deploy-hm.yml`
- alinhado com `develop`
- aponta para `hm.visiomilhas.visiochat.cloud`
- executa gates obrigatórios:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
- validações pós-deploy:
  - healthcheck
  - auth bootstrap
  - Google OAuth bootstrap
  - página `sign-in`
  - página `subscribe`
  - dashboard

### `deploy-prod.yml`
- alinhado com `main`
- aponta para `visiomilhas.visiochat.cloud`
- mantém o fluxo de produção separado do HM

## Dependências operacionais ainda sensíveis
- Configuracao manual do Google OAuth Console para HM e PROD com o mesmo client compartilhado; DEV permanece local-only.
- DNS propagado e resolvido antes do primeiro teste público.
- Traefik já ativo e enxergando a rede/public router.
- Secrets de HM preenchidas no environment correto.
- HM and PROD share the same Google OAuth client; DEV remains local-only.

## Bloqueantes
- Falta de redirect URI e origin da HM no Google Cloud Console.
- Falta de DNS resolvido para `hm.visiomilhas.visiochat.cloud`.
- Falta de secrets válidas no environment de homologação.

## Riscos
- Misturar HM com o fluxo de produção.
- Reusar secrets erradas de PROD em HM.
- Validar HM sem HTTPS/TLS efetivo.
- Deixar router Traefik sem regra exclusiva por host.

## Dependências humanas
- Atualizar Google Cloud Console com:
  - `https://hm.visiomilhas.visiochat.cloud/api/auth/callback/google`
  - `https://hm.visiomilhas.visiochat.cloud`
- Confirmar apontamento DNS.
- Confirmar preenchimento de secrets no GitHub Environment de HM.

## Tempo estimado
- Preparação de DNS/Traefik/certificados: 30 a 60 minutos
- Validação do workflow e smoke tests: 20 a 40 minutos
- Validação manual de OAuth: 10 a 20 minutos
