# Plan Evolution Roadmap

[AGENT]
Nome do agente: Billing Architecture Agent
Status: BILLING_READY

## Objetivo

Descrever a evolução recomendada do catálogo de planos e da política de cobrança do VisioMilhas.

## Estado atual

Hoje a arquitetura suporta:

- trial de 15 dias
- plano recorrente mensal
- base estrutural para assinatura anual
- cancelamento por política de fim de período
- eventos de billing para evolução futura

O billing ainda está em fase de consolidação operacional e arquitetural, não em automação comercial completa.

## Princípios

1. O catálogo de planos deve ser explícito.
2. O trial deve continuar simples e previsível.
3. O plano mensal precisa ser o default de conversão.
4. O plano anual precisa ser o plano de retenção e previsibilidade.
5. O cancelamento deve preservar histórico.
6. O grace period deve ser tratado como política formal, não improviso.
7. A evolução comercial não pode quebrar a leitura de acesso do runtime.

## Roadmap

### Fase 1 - Base estável

Entregas:

- `free_trial`
- mensal
- anual
- `subscriptions` com trial persistido
- `billing_events` para trilha de auditoria

Resultado esperado:

- o usuário entende o trial
- o sistema diferencia plano recorrente e trial
- a cobrança ainda pode ser manual ou semi-automática

### Fase 2 - Cancelamento previsível

Entregas:

- política de `cancel_at_period_end`
- status de fim de ciclo mais claro
- histórico comercial preservado

Resultado esperado:

- cancelamento sem perda de coerência
- usuário permanece com acesso até o fim do ciclo quando aplicável

### Fase 3 - Grace period formal

Entregas:

- política explícita de grace period
- leitura de acesso diferenciada entre leitura e alteração
- observabilidade de expiração e bloqueio

Resultado esperado:

- transição mais suave para inadimplência ou fim de trial
- menos fricção operacional

### Fase 4 - Catálogo comercial administrável

Entregas:

- manutenção de planos via SAAS DB
- eventual tela admin para gestão comercial
- maior separação entre produto e preço

Resultado esperado:

- preços e planos deixam de ser apenas configuração de deploy
- o time comercial ganha mais autonomia

### Fase 5 - Billing automatizado

Entregas:

- integração formal com provider
- webhooks idempotentes
- reconciliação de eventos
- reprocessamento seguro

Resultado esperado:

- status comercial confiável em tempo real
- menor dependência de intervenção manual

## Evolução recomendada dos planos

### Trial

- manter como porta de entrada
- duração padrão: 15 dias
- sem cobrança
- acesso completo

### Mensal

- plano padrão de conversão
- cobrança recorrente
- cancelamento fácil

### Anual

- plano de retenção
- desconto versus mensal
- comunicação comercial destacando economia anual

## Evolução recomendada da experiência

- deixar claro o que acontece após os 15 dias
- diferenciar leitura e escrita em eventual estado de bloqueio
- manter mensagem de confiança:
  - sem cobrança imediata no trial
  - dados preservados
  - plano anual com economia
  - cancelamento controlado

## Riscos da evolução

- mudança de plano sem sincronização com o runtime
- trial expirando sem política clara de acesso
- cancelamento bloqueando acesso cedo demais
- grace period sem persistência formal

## Sequência sugerida

1. estabilizar o catálogo de planos
2. formalizar o cancelamento
3. formalizar o grace period
4. mover preços para administração comercial
5. automatizar provider e webhooks

## Critério de sucesso

A evolução do billing estará madura quando:

- trial, mensal e anual forem claros para o usuário e para o runtime
- cancelamento for previsível
- billing events sustentarem auditoria e reconciliação
- o runtime conseguir decidir acesso sem ambiguidade
- o time consiga evoluir preços sem romper a plataforma

