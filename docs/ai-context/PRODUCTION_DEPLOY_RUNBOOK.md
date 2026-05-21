# PRODUCTION_DEPLOY_RUNBOOK - VisioMilhas

## Status atual

- GitHub Environment `production`: criado pelo operador.
- Secrets do Environment `production`: cadastradas pelo operador.
- Deploy alvo: GitHub Actions para a VPS Hostinger existente.
- Usuário SSH de deploy: `gitdatavisiodeploy`.
- Diretório remoto: `/opt/datavisio/visiomilhas`.
- Domínio público: `https://visiomilhas.visiochat.cloud`.
- Produção inicial: `USE_FIFO_MOVEMENTS_ENGINE=0`.

## Objetivos do runbook

- Servir como guia para a auditoria pré-deploy e para o deploy remoto final.
- Garantir que secrets não sejam expostas e que `.env.production` seja gerado com permissões restritas no host remoto.
- Registrar o fluxo de rollback e os pontos de validação mínimos.

## Secrets esperadas no Environment production

Os nomes abaixo devem existir no GitHub Environment `production`. Os valores não devem ser impressos em logs ou documentação operacional fora desta lista de nomes.

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

## Como o workflow deve validar as secrets

- O job de produção deve usar `environment: production`.
- O job deve falhar cedo se qualquer secret obrigatória estiver ausente.
- A validação deve checar apenas presença e não imprimir valores.
- A validação deve manter `USE_FIFO_MOVEMENTS_ENGINE=0` no primeiro deploy.

## Como o workflow deve gerar .env.production no servidor

- Conectar via SSH com `gitdatavisiodeploy`.
- Entrar no diretório `/opt/datavisio/visiomilhas`.
- Gerar `.env.production` a partir das Environment Secrets do workflow usando as chaves documentadas em `.env.example` e `docs/ai-context/ENVIRONMENT.md`.
- Aplicar `chmod 600 .env.production` imediatamente após a geração.
- Nunca commitar `.env.production`.
- Não usar fallback silencioso para `DATABASE_URL`.

## Rollback seguro

- Reverter para a imagem/artefato anterior conhecido como estável.
- Restaurar o arquivo `.env.production` anterior, se necessário, sem expor seu conteúdo.
- Manter `USE_FIFO_MOVEMENTS_ENGINE=0` durante rollback e recuperação.
- Registrar horário, branch e artefato em caso de incidente.

## Observação sobre o proxy reverso

- O Traefik existente deve ser auditado antes de qualquer deploy final.
- Não criar um novo Traefik enquanto a infraestrutura existente não tiver sido mapeada.

## Comandos read-only para a auditoria 1.3.30

Executar apenas leitura. Não alterar arquivos, serviços, containers ou volumes.

- `whoami`
- `hostname`
- `pwd`
- `docker --version`
- `docker compose version`
- `docker info`
- `docker ps`
- `docker network ls`
- `docker service ls`
- `docker stack ls`
- `ls -la /opt/datavisio/visiomilhas`
- `docker inspect <container_ou_servico_traefik>` quando o Traefik existente for identificado

## Checklist mínimo antes do deploy final

- Confirmar modo Docker: Compose standalone ou Swarm.
- Confirmar rede do Traefik e labels de roteamento.
- Confirmar healthcheck da aplicação.
- Confirmar estratégia de build da imagem.
- Confirmar rollback operacional.
- Confirmar permissão e local do `.env.production` remoto.

## Conclusão da auditoria 1.3.30

- O host está em Docker Swarm ativo com um único manager.
- O Traefik já existe como serviço do stack `traefik` e publica `80`, `443` e `8082`.
- A rede pública adequada para o novo stack é `traefik_public` (overlay, attachable).
- O diretório remoto `/opt/datavisio/visiomilhas` existe, mas está vazio nesta auditoria e ainda não contém repositório Git.
- Estratégia recomendada: `docker stack deploy` em Swarm, reutilizando o Traefik e a rede existente.

## Próximos passos após a auditoria

1. Criar os artefatos Docker de produção para Swarm.
2. Definir o nome do stack do VisioMilhas e a política de healthcheck.
3. Criar o workflow de deploy em GitHub Actions com `environment: production`.
4. Executar o primeiro deploy controlado somente após revisão dos artefatos.

## Variáveis que o workflow deve materializar

- `APP_NAME`
- `APP_URL`
- `NEXT_PUBLIC_APP_URL`
- `NODE_ENV`
- `USE_FIFO_MOVEMENTS_ENGINE`
- `DATABASE_URL`
- `ADM_DATABASE_URL`
- `APP_DATABASE_URL`
- `MONGODB_URI`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `SAAS_DB`
- `APP_DB`
- `MONGODB_SERVER_IP`
- `MONGODB_USER`
- `MONGODB_USER_PASSWORD`
- `MONGODB_DATABASE`
