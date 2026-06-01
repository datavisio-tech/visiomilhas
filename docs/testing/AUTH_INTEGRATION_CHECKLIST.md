# AUTH_INTEGRATION_CHECKLIST - VisioMilhas

Objetivo:

- Validar autenticação e sessão no runtime real de desenvolvimento.
- Não criar ambiente paralelo, mocks, Playwright, Cypress ou banco isolado.
- Executar a rotina manual recorrente com Chrome DevTools MCP.

## Ferramentas permitidas

- Chrome DevTools MCP
- Runtime real de desenvolvimento já existente

## Usuários de teste

Consulte [AUTH_TEST_USERS.md](AUTH_TEST_USERS.md).

## Rotina operacional

### Preparação

1. Abrir o runtime real de desenvolvimento.
2. Garantir que a aplicação esteja autenticável no ambiente atual.
3. Abrir o Chrome DevTools MCP para navegação e inspeção.
4. Selecionar um usuário de teste da lista.

### Cenário 01 - Cadastro

Passos:

1. Abrir `/sign-in`.
2. Clicar em `Criar conta`.
3. Preencher nome, e-mail, senha e confirmação.
4. Enviar o formulário.

Validar:

- usuário criado
- sessão criada
- owner criado
- organização criada
- onboarding iniciado
- redirecionamento correto

Registrar:

- sucesso ou falha
- rota final
- estado da sessão
- observações de DOM/cookies

### Cenário 02 - Login

Passos:

1. Abrir `/sign-in`.
2. Clicar em `Entrar com e-mail`.
3. Informar credenciais do usuário de teste.
4. Enviar o formulário.

Validar:

- autenticação
- criação da sessão
- redirecionamento
- carregamento do dashboard

Registrar:

- usuário utilizado
- rota final
- cookies e sessão observados

### Cenário 03 - Logout

Passos:

1. Estar autenticado.
2. Clicar em sair.

Validar:

- sessão destruída
- cookies removidos
- retorno ao sign-in

Registrar:

- rota pós-logout
- estado final de cookies e sessão

### Cenário 04 - Persistência

Passos:

1. Autenticar.
2. Atualizar navegador.
3. Fechar a aba.
4. Abrir novamente.
5. Navegar entre Dashboard, Contas, Programas, Compras, Transferências e Vendas.

Validar:

- sessão permanece ativa
- navegação entre rotas protegidas continua estável

Registrar:

- comportamento após reload e reabertura
- qualquer perda de sessão

### Cenário 05 - Rotas protegidas

Passos:

1. Deslogado.
2. Acessar diretamente `/dashboard`, `/accounts`, `/programs`, `/purchases`, `/transfers` e `/sales`.

Validar:

- redirecionamento para sign-in
  ou
- bloqueio de acesso

Registrar:

- comportamento de cada rota
- destino final

### Cenário 06 - Organização

Após cadastro, validar:

- organization criada
- owner criado
- associação correta
- workspace inicial criado

Registrar:

- evidência observada no runtime real
- referência das tabelas/entidades que precisam ser conferidas manualmente

### Cenário 07 - Better Auth

Validar:

- account
- session
- user

Verificar:

- expiração
- renovação
- cookies

Registrar:

- estado observado no browser
- qualquer divergência entre sessão e cookies

## Como usar Chrome DevTools MCP

Use o MCP para:

- abrir páginas
- preencher formulários
- validar DOM
- validar cookies
- validar local storage
- validar session state
- validar redirecionamentos

Não criar automações paralelas.

### Exemplos rápidos (Chrome DevTools MCP)

Abaixo há trechos práticos para usar o MCP durante a rotina manual. Ajuste `http://localhost:3000` para o seu runtime.

- Instalar / executar (exemplo):

```bash
npx --registry https://registry.npmjs.org chrome-devtools-mcp@1.1.1
```

- Navegar até a página `/sign-in` (exemplo conceitual):

```json
{
  "action": "navigate",
  "url": "http://localhost:3000/sign-in"
}
```

- Preencher e submeter formulário (exemplo conceitual):

```json
{
  "action": "fill",
  "selector": "input[name=\"email\"]",
  "value": "usuario+teste@exemplo.com"
}

{
  "action": "click",
  "selector": "button[data-test=\"submit-email-login\"]"
}
```

- Capturar cookies e localStorage (exemplo conceitual):

```json
{
  "action": "getCookies"
}

{
  "action": "eval",
  "expression": "JSON.stringify(localStorage)"
}
```

Observações:

- Estes snippets são exemplos conceituais — adapte ao formato de input do seu cliente MCP (ex.: scripts, fixtures ou comandos do cliente CLI que você usa).
- Evite automações que contornem fluxos de consentimento (ex.: autenticação OAuth completa), prefira observar requests/redirecionamentos e coletar evidências (screenshots, HAR, cookies).

## Critério operacional

A rotina deve ser executada no runtime real de desenvolvimento antes de qualquer merge para main quando houver alteração em autenticação, sessão, onboarding ou proteção de rotas.

## Registro final

Ao concluir cada rodada, preencher o template em [AUTH_RUNTIME_REPORT_TEMPLATE.md](AUTH_RUNTIME_REPORT_TEMPLATE.md).
