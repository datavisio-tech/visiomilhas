# Subscription State Machine

[AGENT]
Nome do agente: Billing Architecture Agent
Status: BILLING_READY

## Objetivo

Documentar a máquina de estados da assinatura e do acesso comercial do VisioMilhas.

## Visão geral

A aplicação usa duas camadas relacionadas, mas distintas:

1. **Subscription status**  
   Status persistido na tabela `subscriptions`.

2. **Access state**  
   Estado derivado usado pelo runtime para decidir se a aplicação deve liberar ou bloquear acesso.

## Estados persistidos

### `new`

- ainda sem experiência comercial consolidada
- usado como estado inicial de subscription recém-criada

### `trialing`

- trial ativo
- janela temporal válida
- acesso completo liberado

### `active`

- assinatura paga ativa
- acesso completo liberado

### `canceled`

- assinatura cancelada
- histórico preservado
- acesso pode permanecer até o fim do período pago, se a política assim permitir

### `expired`

- trial ou assinatura expirou
- acesso deve ser bloqueado ou redirecionado para subscribe

### `suspended`

- acesso bloqueado por regra operacional, comercial ou administrativa

## Estados de acesso derivados

### `NO_SUBSCRIPTION`

- não existe assinatura comercial válida
- gate de subscribe deve ser acionado

### `TRIAL`

- trial válido
- acesso completo

### `ACTIVE`

- assinatura paga em vigor
- acesso completo

### `CANCELED`

- assinatura encerrada ou cancelamento já refletido no runtime

### `EXPIRED`

- trial expirou
- acesso bloqueado

### `SUSPENDED`

- bloqueio operacional ou administrativo

## Regras de derivação

O runtime atual traduz o status comercial em acesso com base em:

- `status`
- `trial_ends_at`
- consistência da assinatura
- presença de provisionamento inicial

### Mapeamento atual

- `active` -> `ACTIVE`
- `trialing` -> `TRIAL` se o trial ainda estiver válido
- `trialing` -> `EXPIRED` se a janela já passou
- `expired` -> `EXPIRED`
- `canceled` -> `CANCELED`
- `suspended` -> `SUSPENDED`
- `new` -> `NO_SUBSCRIPTION`

## Transições principais

### 1. Criação inicial

`new` -> `new` com registro de subscription provisionado

Motivo:

- a organização precisa ter um registro comercial mínimo
- o acesso ainda pode permanecer bloqueado até o trial ou a ativação comercial

### 2. Ativação de trial

`new` -> `trialing`

Campos atualizados:

- `plan_id`
- `status`
- `trial_starts_at`
- `trial_ends_at`
- `trial_started_at`
- `trial_expires_at`
- `activated_at`
- `access_state = TRIAL`
- `plan_type`
- `tenant_state`

### 3. Trial válido

`trialing` -> `TRIAL`

Condição:

- `trial_ends_at > now()`

### 4. Trial expirado

`trialing` -> `expired`

Condição:

- `trial_ends_at <= now()`

### 5. Pagamento ativo

`trialing` ou `new` -> `active`

Condição:

- assinatura paga confirmada
- período corrente válido

### 6. Cancelamento

`active` -> `canceled`

Condição:

- cancelamento registrado
- `cancel_at_period_end = true` quando a política exigir permanência até o fim do ciclo

### 7. Expiração ou suspensão

`active` -> `expired` ou `suspended`

Condição:

- fim de vigência sem renovação
- bloqueio administrativo

## Regras de acesso

### Acesso completo

- `TRIAL`
- `ACTIVE`

### Acesso bloqueado / gate de subscribe

- `NO_SUBSCRIPTION`
- `EXPIRED`
- `CANCELED`
- `SUSPENDED`

## Política de trial

- duração padrão: 15 dias
- deve permanecer visível no estado persistido
- deve ser derivável no runtime sem ambiguidade

## Política de cancelamento

- o cancelamento não apaga o histórico
- o cancelamento deve respeitar o ciclo corrente
- o acesso é decidido por política e estado do período

## Grace period

O grace period ainda não aparece como um estado separado no runtime atual.

### Interpretação arquitetural

- pode ser tratado como uma variação de `expired` com acesso de leitura limitada
- se virar requisito formal, merece estado próprio e campo próprio

## Eventos observáveis

O runtime emite eventos como:

- `SUBSCRIPTION_TRIAL_ACTIVE`
- `TRIAL_ACTIVATED`
- `TRIAL_ACCESS_GRANTED`
- `SUBSCRIPTION_ACCESS_GRANTED`
- `COMMERCIAL_ACCESS_GRANTED`
- `TRIAL_EXPIRED`
- `SUBSCRIPTION_ACCESS_BLOCKED`
- `COMMERCIAL_ACCESS_BLOCKED`

Esses eventos ajudam a depurar transições e validar consistência.

## Resumo da máquina de estados

```text
new
  -> trialing
  -> active
  -> canceled
  -> expired
  -> suspended

trialing
  -> TRIAL (runtime)
  -> expired (runtime se vencido)

active
  -> ACTIVE (runtime)
  -> canceled / expired / suspended

canceled
  -> CANCELED (runtime)

expired
  -> EXPIRED (runtime)

suspended
  -> SUSPENDED (runtime)
```

## Critério de qualidade

A máquina de estados está saudável quando:

- não existe ambiguidade entre status e access state
- trial e assinatura paga são distinguíveis
- o cancelamento não destrói histórico
- o runtime é determinístico
- o usuário entende claramente quando está em trial, ativo, cancelado ou bloqueado

