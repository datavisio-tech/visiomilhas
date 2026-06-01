# AUTH_TEST_USERS - VisioMilhas

Este arquivo lista usuários de teste para validação operacional da autenticação no runtime real de desenvolvimento.

Regra:

- Sempre manter os usuários sintéticos abaixo como referência de rotina.
- Ao adicionar novos usuários, seguir o mesmo padrão: e-mail em linha própria e senha na linha seguinte.
- Não usar credenciais reais de pessoas.

## Usuários de teste

### Usuário 01

- Email: emailteste01@teste.com
- Senha: emailteste01

### Usuário 02

- Email: emailteste02@teste.com
- Senha: emailteste02

### Usuário 03

- Email: emailteste03@teste.com
- Senha: emailteste03

### Usuário 04

- Email: emailteste04@teste.com
- Senha: emailteste04

### Usuário 05

- Email: emailteste05@teste.com
- Senha: emailteste05

## Como expandir

Ao incluir novos casos:

1. Adicionar um novo bloco `### Usuário XX`.
2. Registrar o e-mail de teste na linha `Email:`.
3. Registrar a senha de teste na linha `Senha:`.
4. Garantir que o par permaneça fácil de copiar manualmente durante a validação no browser.
