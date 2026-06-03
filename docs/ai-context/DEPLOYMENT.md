# DEPLOYMENT - VisioMilhas

## Objetivo

Registrar o fluxo operacional de deploy, validação de runtime e verificação de artefatos em produção para o VisioMilhas.

## Fluxo Oficial

1. Commit na branch de trabalho.
2. Push para `main` quando a release estiver pronta.
3. GitHub Actions executa o workflow de produção.
4. O workflow prepara o ambiente remoto via SSH.
5. A imagem é construída no host de produção.
6. O container/app é atualizado.
7. Traefik roteia o domínio público para o container ativo.
8. O runtime é validado por HTTP, HTML bruto, console e container inspection.

## GitHub Actions Utilizados

- Workflow principal de produção.
- Workflow manual de confirmação quando necessário.
- Workflow de validação somente quando a release exige confirmação explícita.

## Fluxo de SSH

- `SSH_HOST` aponta para o host de produção.
- `SSH_PORT` é usado pelo workflow para o túnel SSH e para o `ssh-keyscan`.
- `SSH_USER` define o usuário remoto usado na execução dos comandos de deploy.
- A chave privada é carregada apenas no runtime do job e nunca deve ser registrada em texto plano.

## Estratégia de Deploy

- A produção deve ser tratada como fonte de verdade do runtime.
- O deploy deve sempre registrar:
  - SHA do commit publicado
  - SHA da imagem Docker gerada
  - horário de execução do workflow
  - container ativo
  - rota/serviço do Traefik
- A validação pós-deploy deve confirmar que o domínio público aponta para a imagem mais recente.
- Se o deploy falhar, a primeira investigação deve ser do pipeline e do runtime antes de qualquer refatoração funcional.

## Validação de Containers

### Verificações mínimas

- `docker ps`
- `docker images`
- `docker inspect <container>`
- `docker logs <container>`

### O que confirmar

- container ativo correto
- imagem ativa correta
- `WorkingDir`
- `Healthcheck`
- `Env`
- horário de criação da imagem
- labels relevantes do serviço

## Validação do SHA Implantado

- Comparar o SHA do commit publicado com o SHA da imagem em execução.
- Comparar o SHA da imagem com o container ativo inspecionado no host.
- Se o container, a imagem e o commit divergirem, o deploy ainda não está validado.

## Validação de Traefik

### Verificações mínimas

- router ativo
- service ativo
- backend apontando para o container correto
- porta interna correta
- domínio público resolvendo para o serviço esperado

### O que confirmar

- `Host(...)` do domínio
- entrypoint `websecure`
- service associado
- endpoint interno do container
- ausência de roteamento para serviço antigo

## Validação de HTML e Runtime

### Primeira checagem

- abrir o domínio público
- confirmar que o HTML inicial contém `<!DOCTYPE html>`
- confirmar `document.doctype != null`
- confirmar que a página não entra em tela branca

### Checagem de console

Antes de investigar componentes React, validar ausência de:

- `React #418`
- `React #423`
- `HierarchyRequestError`
- `NotFoundError`

### Checagem de autenticação

Quando houver erro de login, sempre validar nesta ordem:

1. HTML bruto
2. `document.doctype`
3. container ativo
4. imagem ativa
5. deploy ativo
6. Traefik
7. somente depois componentes React

## Validação de SHA Ativo

- O SHA do commit publicado deve ser comparado com:
  - SHA do workflow
  - SHA da imagem Docker
  - SHA do container ativo
- Se qualquer um deles divergir, o deploy ainda não foi validado.

## Checklist Pós-Deploy

- [ ] workflow iniciado com o commit esperado
- [ ] build concluído com sucesso
- [ ] imagem publicada
- [ ] container atualizado
- [ ] SHA ativo confirmado
- [ ] Traefik apontando para o serviço correto
- [ ] `WorkingDir` correto no container
- [ ] HTML inicia com `<!DOCTYPE html>`
- [ ] `document.doctype` presente
- [ ] console sem `React #418`
- [ ] console sem `React #423`
- [ ] console sem `HierarchyRequestError`
- [ ] console sem `NotFoundError`
- [ ] login/autenticação funcionando

## Cutover de OAuth Google

- Quando houver troca de client OAuth, validar novamente o `client_id` que chega ao processo Node.
- Confirmar que o callback gerado aponta para o domínio público correto.
- Confirmar que o runtime usa a imagem recém-publicada após a troca de secrets.
- Somente depois disso validar consent screen, callback e criação de sessão.
- Se o runtime ainda emitir o `client_id` antigo, o ponto de falha está entre a atualização do secret e a recriação do container.

## Regras de Segurança

- Nunca registrar secrets, tokens, senhas ou URLs privadas completas.
- Nunca assumir que a imagem nova está ativa apenas porque o push foi feito.
- Nunca concluir uma release sem validar o runtime real no domínio público.

## Padrão de Registro Operacional

Quando uma release for concluída, registrar em changelog ou nota operacional:

- commit publicado
- imagem publicada
- status do workflow
- status do runtime
- qualquer desvio encontrado
