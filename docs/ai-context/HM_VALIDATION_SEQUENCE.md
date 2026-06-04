# HM Validation Sequence

**Status:** HM_INFRA_READY

## Objetivo
Definir a sequência de validação pós-deploy de homologação.

## Fluxo de validação

### 1. Login
- Abrir `https://hm.visiomilhas.visiochat.cloud/sign-in`
- Validar carregamento da página
- Validar ausência de tela branca

### 2. Google OAuth
- Iniciar login com Google
- Validar consent screen
- Validar callback
- Validar criação de sessão

### 3. Subscribe
- Abrir `/subscribe`
- Validar conteúdo e CTA
- Validar bootstrap de assinatura/trial

### 4. Dashboard
- Abrir `/app/dashboard`
- Validar renderização pós-login
- Validar ausência de erros de hidratação

### 5. Purchases
- Abrir `/app/purchases`
- Validar rotas e carregamento
- Validar consistência de dados

### 6. Accounts
- Abrir `/app/accounts`
- Validar listagem e ações básicas

### 7. Programs
- Abrir `/app/programs`
- Validar carregamento e consistência funcional

## Critérios de aceite HM
- `DOCTYPE` presente nas respostas públicas.
- Bootstrap de auth sem `AUTH_BOOTSTRAP_FAILED`.
- Google OAuth concluído com sucesso.
- Sem `503`.
- Sem tela branca.
- Sem erros de hidratação no console.

## Critérios de reprovação HM
- Falha no login.
- `503` em auth.
- `AUTH_BOOTSTRAP_FAILED`.
- `redirect_uri_mismatch`.
- tela branca.
- erro de hidratação.

