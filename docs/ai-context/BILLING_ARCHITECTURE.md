# Billing Architecture

[AGENT]
Nome do agente: Billing Architecture Agent
Status: BILLING_READY

## Objetivo

Definir a arquitetura de billing do VisioMilhas com base no estado atual do repositório, sem alterar comportamento de runtime.

## Resumo executivo

O billing do VisioMilhas é centralizado no banco administrativo `SAAS_DB = controle_adm_saas_datavisio` e não no banco operacional `APP_DB = visiomilhas_app`.

A camada de billing é composta por quatro pilares:

1. **Plans**  
   Catálogo de planos comerciais e seus atributos financeiros.

2. **Subscriptions**  
   Registro por organização do estado comercial, do trial e da vigência do acesso.

3. **Billing events**  
   Trilho de eventos do provedor de pagamento e de integração futura com webhooks.

4. **Access evaluation**  
   Lógica runtime que traduz status de assinatura em estados de acesso da aplicação.

## Fonte de verdade

### Banco de billing

- `controle_adm_saas_datavisio`

### Tabelas principais

- `plans`
- `subscriptions`
- `billing_events`

### Tabelas de suporte

- `global_users`
- `organizations`
- `organization_memberships`
- `admin_audit_logs`

## Modelo atual de dados

### `plans`

Armazena o catálogo comercial.

Campos relevantes:

- `code`
- `name`
- `description`
- `price_cents`
- `currency`
- `billing_interval`
- `is_active`

Uso arquitetural:

- `free_trial` como plano-base de onboarding e trial
- plano mensal como oferta recorrente
- plano anual como oferta de retenção e desconto

### `subscriptions`

Armazena o vínculo entre organização e plano.

Campos relevantes:

- `organization_id`
- `plan_id`
- `status`
- `trial_starts_at`
- `trial_ends_at`
- `trial_started_at`
- `trial_expires_at`
- `activated_at`
- `access_state`
- `plan_type`
- `tenant_state`
- `current_period_start`
- `current_period_end`
- `stripe_customer_id`
- `stripe_subscription_id`
- `cancel_at_period_end`

Uso arquitetural:

- representa a assinatura da organização
- registra o trial e sua janela temporal
- registra vínculo com provedor externo quando existir
- permite cancelamento ao fim do período

### `billing_events`

Armazena eventos do provedor de billing ou integrações futuras.

Campos relevantes:

- `organization_id`
- `provider`
- `event_type`
- `provider_event_id`
- `payload`
- `processed_at`

Uso arquitetural:

- trilha de auditoria comercial
- base para webhooks, reconciliação e reprocessamento
- permite evolução para billing automatizado sem perder histórico

## Runtime atual

O fluxo runtime de acesso comercial está concentrado em:

- `lib/server/subscription-access.ts`

Esse módulo:

- encontra ou cria o registro de assinatura por organização
- garante um plano ativo ou usa fallback `free_trial`
- calcula o estado comercial da sessão
- emite eventos observáveis de acesso

## Estados comerciais suportados

O runtime atual já reconhece:

- `NO_SUBSCRIPTION`
- `TRIAL`
- `ACTIVE`
- `CANCELED`
- `EXPIRED`
- `SUSPENDED`

Esses estados são derivados de:

- status da subscription
- validade do trial
- presença de registro comercial
- consistência do tenant

## Trial

### Regra atual

- o trial padrão dura **15 dias**
- a ativação escreve:
  - `trial_started_at`
  - `trial_expires_at`
  - `trial_starts_at`
  - `trial_ends_at`
  - `activated_at`
  - `access_state = TRIAL`
  - `status = trialing`

### Objetivo de produto

- permitir entrada rápida no produto
- tornar a proposta clara antes da cobrança
- preservar o comportamento de acesso completo durante o trial

## Planos propostos

### Trial

- `free_trial`
- duração padrão: 15 dias
- custo: zero
- acesso: completo

### Mensal

- recorrência mensal
- cobrança contínua
- cancelamento ao fim do ciclo ou por política comercial

### Anual

- recorrência anual
- desconto em relação ao mensal
- foco em retenção e previsibilidade

## Cancelamento

### Regra proposta

- o cancelamento não deve destruir o histórico
- o cancelamento deve ser modelado por:
  - `cancel_at_period_end = true`
  - status final após término do período
- o acesso pode permanecer ativo até o final do ciclo pago, quando aplicável

## Grace period

### Definição

Janela curta após expiração ou cancelamento em que a conta ainda pode visualizar dados, mas já não deve receber novos benefícios pagos.

### Estado atual

- o grace period ainda não é um status de primeira classe com campo dedicado

### Recomendação arquitetural

- tratar o grace period como política de acesso calculada sobre `subscriptions`
- persistir a política se ela virar requisito comercial formal
- manter o estado comercial observável em eventos e logs

## Billing events

### Papel

Os eventos comerciais existem para:

- registrar recebimento de eventos do provider
- reprocessar integrações
- auditar alterações de status
- suportar billing híbrido ou futuro automatizado

### Evolução esperada

- webhook Stripe / provider equivalente
- idempotência por `provider_event_id`
- reprocessamento seguro
- reconciliação com `subscriptions`

## Decisões arquiteturais

1. Billing e subscriptions pertencem ao banco administrativo.
2. O APP DB continua operacional e não deve receber estado comercial.
3. O trial deve ser controlado por janela temporal persistida.
4. O estado de acesso deve ser derivado e observável.
5. Eventos de billing precisam existir mesmo antes do billing automatizado completo.
6. O cancelamento deve preservar histórico e ciclo corrente.
7. O grace period deve ser pensado como política, não como improviso de runtime.

## Riscos conhecidos

- ausência de migration específica para o provedor de billing futuro
- divergência entre `status` comercial e `access_state`
- trial auto-promovido em fluxos de onboarding se a política não for bem controlada
- falta de formalização explícita do grace period no banco

## Critério de sucesso

O billing estará bem resolvido quando:

- o trial puder ser explicado, ativado e expirado de forma previsível
- monthly e annual estiverem claros no catálogo comercial
- cancelamento preservar histórico sem quebra de acesso incoerente
- billing events suportarem auditoria e reconciliação
- o runtime sempre consiga traduzir estado comercial em acesso de forma determinística

