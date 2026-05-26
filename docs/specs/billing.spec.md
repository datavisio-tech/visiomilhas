# billing.spec

Status: draft

Objetivo:

- Descrever o billing individual recorrente do VisioMilhas.

Estado atual:

- Existe documentacao de Stripe/trial, mas o fluxo definitivo ainda nao esta consolidado.
- O gate comercial agora vive no servidor e bloqueia ou libera o dashboard antes do runtime operacional.

Decisao alvo:

- Uma assinatura mensal principal inicialmente.
- Trial de 15 dias.
- Baixa complexidade operacional.
- Estados operacionais obrigatorios: `ACTIVE`, `TRIAL`, `EXPIRED`, `NO_SUBSCRIPTION`, `CANCELED` e `SUSPENDED`.
- A etapa `/subscribe` e o destino obrigatorio quando o acesso comercial nao esta valido.
- Billing/subscription continuam no `SAAS_DB=controle_adm_saas_datavisio`; o `APP_DB=visiomilhas_app` continua apenas operacional.

Riscos:

- Prematuramente introduzir planos demais ou regras de cobranca complexas.
- Misturar billing no APP DB e quebrar a separacao arquitetural.

Proximo passo:

- Reduzir o contrato de billing ao minimo necessario para onboarding e renovacao.
- Manter o gate SaaS observavel e server-side.
- O trial activation runtime deve persistir `activated_at`, `trial_started_at`, `trial_expires_at` e `access_state` no SAAS_DB.
