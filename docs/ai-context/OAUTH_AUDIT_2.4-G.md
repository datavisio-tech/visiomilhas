# Auditoria Google OAuth - 2.4-G

## Data: 2026-05-25

## Objetivo: Resolver `redirect_uri_mismatch` e estabilizar OAuth real no staging

## Estado Atual Descoberto

### ✅ Runtime Verificado
- App localhost rodando em: `http://localhost:3000`
- Sign-in page carregando: `/sign-in?callbackUrl=/app/onboarding`
- Botão Google OAuth funcional
- Redirecionamento para Google OAuth correto
- **Callback URI gerado corretamente**: `http://localhost:3000/api/auth/callback/google`

### ✅ Database
- Todas 4 tabelas Better Auth existem no banco ADM
  - `ba_users`
  - `ba_sessions`
  - `ba_accounts`
  - `ba_verification`
- Migration pronta e aplicada

### ✅ Environment
- `.env.local` configurado para desenvolvimento
- `NODE_ENV=development` ativo
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `BETTER_AUTH_URL=http://localhost:3000`

### 🔴 Bloqueador Identificado
Google OAuth está esperando URIs de callback diferentes daqueles registrados no Google Cloud Console.

**URI Esperada (localhost dev)**:
```
http://localhost:3000/api/auth/callback/google
```

**URI Registrada (production)**:
```
https://visiomilhas.visiochat.cloud/api/auth/callback/google
```

## Ação Necessária

### Passo 1: Verificar Google Cloud Console
1. Abrir Google Cloud Console
2. Navegue para Credenciais OAuth 2.0 (credentials)
3. Localize aplicação: "VisioMilhas"
4. Client ID: `469564365250-b21amqa3fgjqs0c6rbeod71nfaul3ikk.apps.googleusercontent.com`

### Passo 2: Atualizar URIs Autorizadas
**Authorized redirect URIs** deve conter:
```
http://localhost:3000/api/auth/callback/google
http://localhost:3001/api/auth/callback/google
https://visiomilhas.visiochat.cloud/api/auth/callback/google
```

**Authorized JavaScript origins** deve conter:
```
http://localhost:3000
http://localhost:3001
https://visiomilhas.visiochat.cloud
```

### Passo 3: Verificar Secrets
- `GOOGLE_CLIENT_ID`: ✅ Presente em `.env` (já verificado)
- `GOOGLE_CLIENT_SECRET`: ✅ Presente em `.env` (já verificado)

## Próximos Passos na Sequência

1. ✅ Confirmar tabelas Better Auth existem (DONE)
2. ✅ Confirmar runtime OAuth está correto (DONE)
3. ⏳ **Adicionar URIs localhost ao Google Console**
4. ⏳ Testar fluxo OAuth completo (login, callback, onboarding, logout, refresh, reopen)
5. ⏳ Validar persistência de sessão em `ba_sessions`
6. ⏳ Executar validações lint/typecheck/test
7. ⏳ Atualizar documentação AI
8. ⏳ Criar commit 2.4-G

## Tempo Estimado

- Google Console update: 5-10 min
- Browser flow validation: 15-20 min
- Observabilidade + testes: 20-30 min
- Documentação: 10 min

## Notas Operacionais

- O erro "JavaScript está desativado" durante automação de bot é normal - Google bloqueia logins bot
- Fluxo deve ser validado manualmente no navegador
- Tras correção Google Console, o fluxo OAuth deverá funcionar end-to-end
