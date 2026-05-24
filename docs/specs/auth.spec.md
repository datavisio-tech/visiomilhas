# auth.spec

Status: draft

Objetivo:

- Definir a estrategia de autenticacao e ownership do VisioMilhas para B2C individual.

## Estado atual

- Há leitura de hotspots por source para identificar superfícies não estabilizadas.
- O boundary de leitura normal já está hardened por padrão; fallback agora é recovery-only explícito.
- A matriz operacional expõe readiness score, fallback rate e nível de estabilização.

Decisao alvo:

- Helpers de auth/ownership agnosticos de provider como contrato principal.
- Better Auth como adaptador de sessao e callback, nao como dominio.
- Google OAuth primeiro.
- Email/senha depois.
- Sessao protegida no servidor.
- Admin interno separado de usuarios comuns.
- Ownership por userId como eixo central.
- `orgSlug` nao deve ser boundary de escrita; `organizationId` deve vir da ownership resolvida no servidor.
- Fake-auth adapter como transitional para desenvolvimento local, testes e recovery controlado.
- Matrix operacional com status Better Auth, fallback usage, ownership status, rollout status e stabilization level.

## Estados operacionais

- Transitional: fallback permitido, rollback ativo e observabilidade obrigatória.
- Stabilized: Better Auth dominante, fallback raro e métricas estáveis.
- Hardened: sem fallback operacional no runtime, fake adapter apenas para dev/test/recovery.
- Continuar a redução incremental das superfícies de leitura e registrar readiness para remoção futura somente com fallback near-zero.
- Tratar o fake adapter como candidato a dev/test-only apenas após a confirmação de near-zero no runtime.

## Onboarding 2.3-C — Initial User Onboarding Flow

- Adicionado: página `/onboarding` e server action para provisionamento inicial idempotente (organization + default program + program_account).
- Comportamento: ao primeiro login o sistema cria uma `organization` no DB administrativo e um `loyalty_program` + `program_account` no app DB; usuários sem organização são direcionados ao `/onboarding`.
- Observabilidade mínima: registrar eventos `onboarding_started`, `onboarding_completed` e `onboarding_failed` via `auth-observability`/logs.

## Readiness Summary (2026-05-24)

- O que foi estabilizado: boundary de leitura hardened por padrão; matriz operacional e `auth-observability` registram fallback e readiness score.
- O que permanece transitional: superfícies legadas que ainda aceitam fallback recovery-only; algumas rotas de leitura ainda usam `organizationId` para compatibilidade.
- Riscos mitigados: redução do uso de `orgSlug` como entrada confiável; rollout incremental com rollback simples preservado.
- Readiness onboarding: base preparada para Google OAuth e criação de conta pessoal; sessões server-side já definidas no contrato.
- Próximos passos: aplicar helpers reais nas rotas críticas (purchases/sales/transfers), medir fallback por surface e continuar redução incremental.
- Manter o caminho recovery-only como contingência explícita enquanto a cobertura hardened é validada.

Riscos:

- Bypass de autorizacao se a protecao ficar apenas na UI.
- Divergencia entre auth e ownership.
- Acoplamento excessivo a organizationId/slug.

Proximo passo:

- Consolidar os helpers reais de auth/ownership sem acoplamento a Better Auth.
- Mapear os pontos de entrada do app e definir a primeira fronteira de auth server-side.
- Reduzir a confiança em organizationId vindo da UI e manter transferencias sob verificacao dupla de ownership.
- Manter fallback auditável até que as métricas indiquem estabilidade suficiente para reduzir mais a dependência do transitional.
- Continuar a redução incremental das superfícies de leitura e registrar readiness para remoção futura somente com fallback near-zero.
- Tratar o fake adapter como candidato a dev/test-only apenas após a confirmação de near-zero no runtime.
