# organizations.spec

Status: draft

Objetivo:

- Registrar como o produto usa organization_id sem expor uma experiencia multi-organizacao enterprise.

## Estado atual

- O runtime ainda depende de uma trilha transitional em leitura, então organizationId segue sendo contexto derivado, não boundary de entrada.
- O boundary de leitura normal foi endurecido para não depender de fallback implícito.
- O fake adapter só pode virar dev/test-only oficialmente quando a redução de fallback estiver near-zero em runtime.
- Recovery-only segue permitido como contingência explícita enquanto a superfície hardened se consolida.
- Acompanhar a decadência dos hotspots antes de endurecer a classificação para hardened.

## Readiness Summary (2026-05-24)

- O que foi estabilizado: operação centrada em conta/pessoa, com `organization_id` tratado como compatibilidade e boundary de leitura hardened nas superfícies migradas.
- O que permanece transitional: leituras legadas que ainda dependem de fallback; fake adapter disponível para recovery/testing.
- Riscos mitigados: menor exposição de multi-org na UX; redução do risco de `organization_id` ser usado como boundary de autorização.
- Readiness onboarding: fluxo B2C preparado incluindo criação de conta pessoal e roadmap do Google OAuth.
- Próximos passos: consolidar contrato de account/ownership, remover `orgSlug` das mutações restantes e medir fallback por superfície antes de retirar o fake adapter.
- Seguir reduzindo organizationId apenas em caminhos já hardened, sem abrir novos contratos.

## Onboarding 2.3-C — Initial User Onboarding Flow

- Readiness onboarding: implementado provisionamento idempotente de organização pessoal e conta app para novos usuários.
- O fluxo cria uma `organization` administratively e um programa + conta no app DB, mantendo ownership vinculada ao `global_user`.
- Risco operacional: validar em staging para assegurar que não haja duplicação de slug ou conflitos de FK entre adm/app DBs.

## Onboarding 2.3-D — Telemetry & Auth Flow Stabilization

- O risco de duplicidade deve ser tratado com guards simples e deduplicação incremental, não com locking complexo.
- Rotas e retries devem continuar server-side first.
- Readiness de staging deve considerar slug collision, race conditions e provisionamento parcial.

## Onboarding 2.3-E — Staging Validation & OAuth Runtime Hardening

- organizationId continua derivado no servidor e não deve virar boundary de entrada.
- slug determinístico por usuário reduz colisão durante retry e staging validation.
- Retentativas e provisionamento parcial devem continuar idempotentes e server-side first.

## Onboarding 2.3-G — First Real Staging Validation & OAuth Operational Audit

- Readiness onboarding: transitional até a validação com usuários de teste reais em staging.
- Readiness runtime: stable quando a recuperação parcial e a prevenção de duplicidade estiverem observadas sem regressão.
- Readiness deploy: transitional até o checklist operacional de staging ser concluído.

## Onboarding 2.4-A — Controlled Real Staging Rollout

- Readiness onboarding: stable only after o primeiro usuário real de teste completar login, onboarding e recovery sem duplicidade.
- Readiness recovery: stable quando usuários parcialmente provisionados forem recuperados sem criar organização ou conta duplicada.
- Readiness deploy: transitional enquanto o rollout permanecer pequeno e reversível.

## Onboarding 2.4-B — Real Interface Validation & Browser Runtime Audit

- Readiness browser: transitional until the public sign-in page validates redirect, callback and recovery in browser real.
- Readiness UX: stable only when loading/error feedback and onboarding retry are visible and consistent.
- Readiness onboarding: remains transitional until a full sign-in -> callback -> onboarding -> dashboard path is observed without 404 or loop.

Decisao alvo:

- Experiencia principal de conta/pessoa.
- organization_id mantido apenas como compatibilidade tecnica e fallback legível para alguns fluxos legados.
- `orgSlug` nao deve ser usado como boundary de escrita.
- `organizationId` continua a existir como contexto derivado, nao como entrada confiável da UI.
- A operação deve continuar observável com primeiro/último uso de fallback por superfície antes de qualquer retirada futura do fake adapter.
- O fake adapter só pode virar dev/test-only oficialmente quando a redução de fallback estiver near-zero em runtime.

Riscos:

- Vazar dependencia de multi-org na UX antes da hora.
- Converter organization_id em boundary de autorizacao.

Proximo passo:

- Definir o contrato entre conta individual, ownership e dados administrativos globais.
- Reduzir o papel de organization_id nos fluxos de escrita.
- Consolidar transferencias e mutacoes criticas com ownership resolvida no servidor.
- Manter a derivação de escopo no servidor enquanto o fallback transitional for retirado gradualmente.
- Mapear a última superfície legada de leitura que ainda depende de fallback direto e tratá-la sem mudar o domínio.
- Acompanhar a decadência dos hotspots antes de endurecer a classificação para hardened.
