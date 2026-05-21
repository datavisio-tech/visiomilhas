# PRODUCTION_INFRA_AUDIT - VisioMilhas

## Escopo

- Auditoria read-only da VPS Hostinger de produção antes do primeiro deploy do VisioMilhas.
- Objetivo: identificar a topologia real de Docker, Compose, Swarm, Traefik, Portainer e diretório remoto.
- Nenhum arquivo foi alterado no servidor.
- Nenhum serviço foi reiniciado, criado ou removido.

## Resumo executivo

- O host está com Docker ativo e Docker Swarm habilitado.
- O Traefik existente roda como serviço do stack `traefik`.
- A rede pública do Traefik é a overlay `traefik_public`.
- O diretório remoto esperado `/opt/datavisio/visiomilhas` existe, mas está vazio e não contém repositório Git nesta auditoria.
- A estratégia recomendada para o deploy do VisioMilhas é `docker stack deploy` em Swarm, reutilizando o Traefik existente.

## Evidências sanitizadas

### Identidade do host

- `whoami`: `gitdatavisiodeploy`
- `hostname`: `visiochat`
- `pwd`: `/home/gitdatavisiodeploy`
- `id`: `uid=1001(gitdatavisiodeploy) gid=1001(gitdatavisiodeploy) groups=1001(gitdatavisiodeploy),27(sudo),100(users),989(docker)`
- `groups`: `gitdatavisiodeploy sudo users docker`

### Docker e Compose

- `docker --version`: `Docker version 29.2.1, build a5c7197`
- `docker compose version`: `Docker Compose version v5.0.2`
- `docker info`: Docker Engine Community, 15 containers, 12 running, 3 stopped, overlay network available, Swarm active, manager node único.

### Swarm

- Swarm: `active`
- Manager: `true`
- Nodes: `1`
- Node role local: manager
- Stack list: `3_postgres`, `4_redis`, `5_minio`, `6_mongodb`, `portainer`, `traefik`
- Service list confirma implantação via Swarm e não via Compose standalone.

### Serviços e containers relevantes

- `traefik_traefik`: `traefik:latest`, replicado `1/1`, portas publicadas `80`, `443` e `8082`
- `portainer_portainer`: `portainer/portainer-ce:latest`, portas `9000` e `9443`
- `portainer_agent`: `portainer/agent:latest`, global `1/1`
- `3_postgres_postgres`: `pgvector/pgvector:0.8.0-pg17`, porta `5432`
- `3_postgres_pgadmin`: `dpage/pgadmin4:latest`
- `4_redis_redis` e `4_redis_redis-commander`
- `5_minio_minio` e `5_minio_minio-archiver`
- `6_mongodb_mongodb`
- Não há serviço/container do VisioMilhas ainda.

### Traefik

- Serviço: `traefik_traefik`
- Imagem: `traefik:latest@sha256:aaf0f6185419a50c74651448c1a5bf4606bd2d2ddb7b8749eed505d55bf8b8ea`
- Modo: replicated com 1 réplica
- Constraints: `node.role == manager`
- Rede: `traefik_public`
- Portas: `80->80/tcp`, `443->443/tcp`, `8082->8080/tcp`
- Labels relevantes:
  - `com.docker.stack.namespace=traefik`
  - `traefik.enable=true`
  - `traefik.http.routers.traefik.entrypoints=websecure`
  - `traefik.http.routers.traefik.rule=Host(`traefik.visiochat.cloud`)`
  - `traefik.http.routers.traefik.service=api@internal`
  - `traefik.http.routers.traefik.tls.certresolver=le`
  - `traefik.http.services.traefik.loadbalancer.passHostHeader=true`
- Mounts:
  - `/var/run/docker.sock` read-only
  - volume `traefik_certificates` em `/letsencrypt`

### Redes

- `traefik_public`: overlay, scope swarm, attachable `true`, ingress `false`, internal `false`
- `ingress`: overlay, scope swarm
- `bridge`: bridge local
- `docker_gwbridge`: bridge local
- `kanbanflow-pro_kanban_network`: bridge local

### Volumes

- `traefik_certificates`
- `portainer_data`
- `pgadmin_data`
- `redis_data`
- `mongodb_data`
- `mongodb_configdb_data`
- `minio_data`
- `5_minio_minio_backup_data`
- `3_postgres_postgres_data`
- `kanbanflow_kanban_data`
- `kanbanflow-pro_kanban_data`

### Diretório remoto

- `/opt/datavisio`: existe, pertence a `root` no diretório pai e contém a pasta `visiomilhas`
- `/opt/datavisio/visiomilhas`: existe, pertence a `gitdatavisiodeploy`, mas está vazio nesta auditoria
- Não há evidência de repositório Git no diretório remoto
- Não foram encontrados arquivos de compose, stack, Dockerfile ou package.json no diretório remoto auditado

## Conclusão arquitetural

- O ambiente de produção já está estruturado em Swarm, com Traefik publicado como serviço do stack `traefik`.
- A estratégia mais coerente para o VisioMilhas é usar `docker stack deploy` com stack próprio, reutilizando a rede overlay `traefik_public` e as labels de Traefik.
- A abordagem `docker compose standalone` não parece alinhada ao estado real do host atual.

## Pendências descobertas

- Definir nome do stack e layout dos artefatos Docker do VisioMilhas.
- Definir como o `.env.production` será gerado pelo workflow antes do deploy.
- Definir healthcheck da aplicação e política de rollback para o stack.
- Confirmar se a aplicação usará rede externa `traefik_public` e um volume/provisionamento adicional para persistência, se necessário.

## Próxima etapa recomendada

1. Criar os artefatos Docker de produção para Swarm, já alinhados ao Traefik existente.
