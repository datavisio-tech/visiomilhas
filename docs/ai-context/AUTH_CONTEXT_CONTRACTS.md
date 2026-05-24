# AUTH_CONTEXT_CONTRACTS - Fase 2.2

Status: draft

Objetivo:

- Definir o núcleo mínimo de identidade, ownership e boundaries com helpers reais.
- Introduzir Better Auth apenas como adaptador de sessão e provider, sem mudar os contratos centrais.

Premissa arquitetural:

- O sistema e B2C, com ownership por usuario/conta.
- organization_id pode permanecer apenas como compatibilidade tecnica futura.
- Auth real ainda nao e implementada como boundary principal nesta fase.

## Estrutura sugerida de AuthContext

Contrato conceitual minimo:

```ts
type AuthContext = {
  userId: string;
  email?: string;
  authProvider: "google" | "email" | "unknown";
  sessionId?: string;
  isAuthenticated: boolean;
  isInternalAdmin?: boolean;
  issuedAt?: Date;
  expiresAt?: Date;
};
```

Regras:

- userId e a raiz do contexto.
- email e apenas informativo no boundary.
- isInternalAdmin e um flag restrito para operacoes internas.
- organizationId nao deve ser o centro do contexto.

## Estrutura sugerida de OwnershipContext

Contrato conceitual minimo:

```ts
type OwnershipContext = {
  userId: string;
  accountId?: number;
  organizationId?: number | null;
  ownsAccount: boolean;
  ownsOrganizationScope: boolean;
};
```

Regras:

- ownsAccount e o criterio principal.
- organizationId pode existir somente como compatibilidade e para leituras legadas.
- A futura autorizacao nao deve depender de hierarquia de memberships.

## Estrutura sugerida de sessão

Sessao server-side conceitual:

```ts
type SessionContext = {
  auth: AuthContext;
  ownership: OwnershipContext;
};
```

Regras:

- A sessao deve ser resolvida no servidor.
- Route Handlers, Server Actions e Server Components devem consumir o mesmo contrato.
- Cookies seguros e httpOnly serao responsabilidade da implementacao futura.

## Boundaries obrigatórias

1. Auth boundary: valida se ha sessao e identidade.
2. Ownership boundary: valida se o recurso pertence ao usuario autenticado.
3. Route boundary: bloqueia mutacoes sem sessao e sem ownership.
4. Service boundary: nao aceita parametros de ownership sem validacao do contexto.
5. Repository boundary: recebe contexto autorizado, nao slug bruto.

## Contratos mínimos sugeridos

### Auth helpers reais desta fase

```ts
type RequireAuthResult = {
  auth: AuthContext;
};

type RequireOwnershipResult = {
  auth: AuthContext;
  ownership: OwnershipContext;
};
```

Helpers reais e agnósticos de provider:

- normalizeAuthProvider()
- buildAuthContext()
- resolveAuthContext()
- requireAuth()
- buildOwnershipContext()
- resolveOwnershipContext()
- requireOwnership()
- requireInternalAdmin()
- buildSessionContext()
- resolveSessionContext()

Regra obrigatória desta fase:

- Nenhum helper deve importar ou depender de Better Auth.
- Better Auth, quando vier depois, sera apenas um adaptador de entrada para SessionContextInput.

### Route protection futura

- Rotas autenticadas devem falhar cedo sem sessao.
- Rotas de mutacao devem validar ownership antes do service.
- Rotas publicas devem nunca inferir ownership por slug.

### Server Action protection futura

- Server Actions devem receber contexto autorizado ou resolver contexto no inicio.
- Nao devem depender de orgSlug como fonte de autorizacao.

### Repository protection futura

- Repositories devem receber userId e ownership scope explicitamente.
- Queries sensiveis devem ser parametrizadas por ownership, nao por parametros livres.

## Fluxo futuro esperado de autenticação

1. Request chega.
2. Sessao server-side e resolvida.
3. AuthContext e produzido.
4. OwnershipContext e derivado.
5. Route/Action valida acesso.
6. Service executa regra.
7. Repository executa query com escopo autorizado.

## Fluxo futuro esperado de ownership

1. Identidade autenticada.
2. Recurso resolvido no servidor.
3. Ownership validado por userId.
4. organizationId usado apenas se o recurso legado exigir compatibilidade.
5. Persistencia executada com escopo minimo.

## Estrategia Better Auth futura

- Better Auth deve permanecer como adaptador de entrada, nao como centro do dominio.
- Google OAuth entra primeiro.
- Email/senha pode entrar depois sem alterar boundaries.
- A integracao deve mapear o payload externo para AuthContext, OwnershipContext e SessionContext, sem mudar os helpers.
- A fundacao atual expõe `/api/auth/[...all]` e um resolver server-side baseado em `auth.api.getSession`.

## Estrategia Google OAuth futura

- Google OAuth entra como provider primario inicial.
- O callback deve consolidar userId e ownership inicial.
- Nao deve criar memberships complexas.

## Estrategia de middleware futura

- Middleware deve proteger area autenticada e redirecionar rotas publicas sensiveis.
- Middleware nao deve decidir ownership final sozinho.
- Ownership final deve ser confirmado no servidor antes de mutacao.

## Estrategia de Route Handlers futura

- Route Handlers devem resolver auth/ownership antes de chamar services.
- Route handlers de mutacao nao devem aceitar slug como escopo confiavel.

## Estrategia de Server Actions futura

- Server Actions devem chamar helpers de auth/ownership no inicio.
- Actions devem ser pequenas e sem conhecimento de auth provider.

## Onboarding e provisionamento inicial

- A resolução de sessão pode acionar um provisionamento idempotente não-blocking (criação de `global_user`, `organization` e recursos iniciais do app) quando detectado primeiro login.
- O provisionamento não deve bloquear a experiência de login; erros devem ser logados e tratados como observabilidade (não lançar para o usuário).
- Rotas protegidas devem redirecionar server-side para `/onboarding` quando o usuário estiver autenticado, mas não possuir organização pessoal criada.

## Telemetria e estabilização do onboarding

- Eventos de onboarding devem expor apenas `source`, `timestamp`, `fallback state`, `onboarding state` e `flow stage`.
- A telemetria não deve registrar email completo, tokens, cookies ou sessão bruta.
- O fluxo deve suportar retry seguro e idempotência completa, inclusive para usuários parcialmente provisionados.

## Staging validation e OAuth hardening

- A validação de staging deve observar callback, sessão persistida, logout, refresh e retry onboarding.
- A telemetria deve registrar `OAUTH_CALLBACK_FAILED`, `OAUTH_REDIRECT_LOOP` e `OAUTH_RUNTIME_STAGING_CHECK` sem expor payload sensível.
- O estado parcial do onboarding deve ser recuperável por server-side guards simples, sem locking complexo.
## Estrategia de repositories futura

- Repositories devem operar com contexto autorizado, nao com parametros de UX.
- organizationId pode continuar em queries legadas, mas nao como boundary principal.

## Estrategia de services futura

- Services devem assumir contexto validado.
- Services nao devem confiar em parametros externos para acesso.

## Módulos que devem ser protegidos primeiro

1. Compras
2. Vendas
3. Transferências
4. Lançamentos
5. Dashboard
6. Contas
7. Programas

## Queries críticas atuais

- Todas as consultas que resolvem organization por slug no ADM.
- Todas as consultas do APP que dependem de organizationId derivado externamente.
- Todas as mutações que usam accountId sem ownership explícito.

## Simplificações arquiteturais recomendadas

- Remover memberships complexas do escopo da Fase 2.
- Tratar organization_id como compatibilidade legada, nao como centro do modelo.
- Consolidar autorizacao em user ownership.
- Evitar RBAC enterprise.
- Evitar multi-workspace.

## Rollout incremental sugerido

1. Definir contratos de AuthContext e OwnershipContext.
2. Criar helpers conceituais de resolve/require.
3. Integrar helpers nas routes e Server Actions mais sensiveis.
4. Simular boundary com fake auth adapters controlados.
5. Proteger leitura critica em seguida.
6. Ajustar repositories para receber contexto autorizado.
7. Integrar Better Auth com Google OAuth.
8. Adicionar email/senha depois.

## Fase 2.1-C

Objetivo:

- Integrar os helpers nas rotas e Server Actions mais criticas antes de plugar provider real.

Regras desta fase:

- Proteger primeiro purchases, sales e transfers.
- Depois proteger dashboard, entries e accounts.
- Nao usar middleware global ainda.
- Manter boundary server-side explicito.
- Orientar requireOwnership por recurso, com accountUserId, e nao por organizationId.
- Manter schema inalterado nesta etapa.
- Usar fake auth adapters controlados para simular sessao e validar fluxo.

## Fase 2.1-D

Objetivo:

- Aplicar read enforcement sem confiar em slug ou params de leitura.

Regras desta fase:

- Leitura critica deve receber sessionContext, nao orgSlug.
- Route/server component pode resolver a session simulada, mas o service deve derivar o escopo.
- Dashboard, accounts, entries, purchases, sales e transfers devem usar o mesmo fluxo de leitura.
- O cliente nao define escopo de leitura.
- Middleware global continua fora do escopo.

## Fase 2.2

Objetivo:

- Criar a fundacao de Better Auth com Google OAuth, cookies seguros e sessao server-side real.

Regras desta fase:

- Preservar AuthContext, OwnershipContext e SessionContext.
- Preservar fake-auth adapter e read-scope enquanto a migracao nao estiver completa.
- Usar Better Auth apenas como provider de sessao e callback.
- Manter a integracao no servidor; nada de middleware global para bloquear o app inteiro.
- Nao alterar schema de negocio nesta etapa.

## Fase 2.2-B

Objetivo:

- Migrar de forma controlada entradas específicas para Better Auth, começando por purchases, sales e transfers.

Regras desta subfase:

- `resolveCurrentBetterAuthSessionContext()` vira a entrada única de sessão para os fluxos migrados.
- `fake-auth-adapter` continua como fallback operacional até a remoção gradual.
- A resolução de sessão continua centralizada em uma camada única; routes não chamam Better Auth diretamente.
- Middleware global continua fora do escopo.
- A migração deve ser incremental e reversível por fluxo.

## Fase 2.2-E

Objetivo:

- Reduzir a superfície transitional, medir uso real do fallback e consolidar Better Auth operacionalmente.

Regras desta fase:

- `auth-observability.ts` deve registrar source, reason, firstSeen e lastSeen por superfície sem expor payload sensível.
- Pages e Server Components de leitura devem passar por sessões resolvidas no servidor; o fake adapter fica apenas como fallback transitional controlado.
- `resolveReadScope()` deve continuar derivando escopo no servidor e não pode introduzir confiança em `orgSlug`.
- A matriz operacional deve registrar status de Better Auth, fallback usage, ownership status, rollout status e stabilization level.
- A remoção futura do fake adapter só pode ser considerada com fallback near-zero, sem incidentes relevantes e com cobertura mínima estável.

Contratos de observabilidade sugeridos:

## Readiness Summary (2026-05-24)

- O que foi estabilizado: contratos conceituais de `AuthContext`, `OwnershipContext` e `SessionContext`; helpers sugeridos estão documentados; boundary server-side e regras de proteção estão definidas.
- O que ainda é transitional: fake-auth adapter permanece disponível como fallback recovery-only em superfícies legadas; algumas leituras ainda derivam `organizationId` como compatibilidade.
- Riscos reduzidos: menor dependência direta de `orgSlug` em mutações de escrita; fallback agora é auditável (origem, motivo, timestamp).
- Readiness onboarding: Google OAuth preparado como provider inicial; criação de conta pessoal e sessão server-side são suportadas pelo contrato; onboarding B2C pode ser implementado incrementalmente sem RBAC.
- Readiness deploy: não há alterações de schema/migrations; safe to deploy docs and helpers; mantenha deploy manual controlado.
- Próximos passos: implementar helpers reais, migrar rotas críticas uma a uma, registrar hotspots e manter fallback near-zero antes de retirar o fake adapter.

- `bySource`
- `byReason`
- `bySourceAndReason`
- `firstSeenBySource`
- `lastSeenBySource`

## Fase 2.2-F

Objetivo:

- Limpar as últimas superfícies transitional e preparar o fake adapter para uso dev/test/recovery-only no futuro.

Regras desta fase:

- Actions, pages e services devem depender da camada controlada, não do fake adapter diretamente.
- `auth-observability.ts` deve suportar hotspots por source para identificar superfícies não estabilizadas.
- O fallback residual deve ser reduzido apenas em caminhos estáveis com ownership consolidada e rollback simples.
- `resolveReadScope()` continua como boundary de leitura e não deve voltar a aceitar escopo bruto do cliente.
- A classificação operacional deve distinguir transitional, stabilized e hardened sem alterar contratos centrais.

Readiness futura para fake adapter dev/test-only:

- fallback near-zero no runtime;
- hotspots conhecidos e em declínio;
- cobertura mínima dos caminhos restantes;
- ausência de incidentes recentes ligados ao fallback;
- rollback simples preservado.
## Fase 2.2-F

- rollback simples preservado.

Restrições permanentes:

- Sem middleware global.
- Sem RBAC enterprise.
- Sem ACL engine.
- Sem reescrita ampla do domínio.
- Sem ACL engine.

## Fase 2.2-G

Objetivo:

- Finalizar a redução transitional e deixar o fallback restrito a recovery explícito, mantendo Better Auth dominante.

Regras desta fase:

- `resolveReadScope()` deve operar hardened por padrão e só acionar fallback quando `allowFallback` for explicitamente habilitado.
- A leitura normal do runtime não deve depender do fake adapter.
- A matriz operacional deve expor readiness score, fallback rate, fallback count, coverage e stabilization level.
- Superfícies hardened, stabilized e transitional devem permanecer classificadas sem alterar os contratos centrais.
- O fake adapter deve ser tratado como dev/test/recovery-only na prática operacional, não como caminho silencioso de runtime.

Readiness futura para remoção opcional do fake adapter:

- fallback near-zero no runtime;
- hotspots em queda;
- cobertura hardened estável;
- ausência de incidentes recentes;
- rollback simples preservado.

## Rollback seguro

- Se a nova fronteira causar regressao, reverter apenas o boundary novo e manter o comportamento anterior de leitura.
- Nao mexer em schema, deploy ou migrations durante rollback da fase.
- Preservar organizationId como fallback tecnico temporario ate o boundary novo estabilizar.
