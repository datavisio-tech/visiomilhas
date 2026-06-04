# HM Deployment Sequence

**Status:** HM_INFRA_READY

## Objetivo
Sequenciar a ativação de `hm.visiomilhas.visiochat.cloud` com o mínimo risco operacional.

## Ordem exata de execução

### Passo 1
Confirmar o DNS de `hm.visiomilhas.visiochat.cloud`.

### Passo 2
Confirmar que o Traefik do host está ativo e conectado à rede pública.

### Passo 3
Confirmar que o certificado TLS para HM está disponível no resolver do Traefik.

### Passo 4
Confirmar que o environment de HM no GitHub possui todas as secrets obrigatórias.

### Passo 5
Confirmar que o workflow `deploy-hm.yml` está associado ao branch `develop`.

### Passo 6
Executar os gates de CI:
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### Passo 7
Disparar o deploy de HM.

### Passo 8
Validar o healthcheck do container.

### Passo 9
Validar auth bootstrap.

### Passo 10
Validar Google OAuth bootstrap.

### Passo 11
Validar as páginas:
- `/sign-in`
- `/subscribe`
- `/app`

### Passo 12
Validar dashboard e rotas operacionais:
- `/app/dashboard`
- `/app/accounts`
- `/app/programs`
- `/app/purchases`

### Passo 13
Validar DOCTYPE nas respostas públicas.

### Passo 14
Validar ausência de:
- `AUTH_BOOTSTRAP_FAILED`
- `503`
- erros de hidratação
- tela branca

### Passo 15
Documentar a evidência e liberar HM para testes funcionais.

## Dependências humanas
- Confirmar Google OAuth Console atualizado para HM.
- Confirmar DNS e TLS resolvidos.

## Pontos de atenção
- HM deve usar a infraestrutura atual sem tocar na produção.
- HM deve ser validado com o mesmo client OAuth compartilhado de PROD.
- HM não deve herdar dados de PROD.

## Tempo estimado
- Deploy técnico: 10 a 20 minutos
- Validação funcional: 20 a 40 minutos
- Ajustes de DNS/OAuth, se necessários: 15 a 30 minutos

