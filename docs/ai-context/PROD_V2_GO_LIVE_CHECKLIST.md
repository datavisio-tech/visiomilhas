# PROD V2 Go-Live Checklist

**Status:** PROD_V2_CUTOVER_READY

## Pré-go-live
- [ ] `controle_adm_saas_datavisio` criado
- [ ] `visiomilhas_app` criado
- [ ] `ADM_DATABASE_URL` aponta para o banco ADM correto
- [ ] `APP_DATABASE_URL` aponta para o banco APP correto
- [ ] `BETTER_AUTH_SECRET` válido e não vazio
- [ ] `GOOGLE_CLIENT_ID` válido
- [ ] `GOOGLE_CLIENT_SECRET` válido
- [ ] HM e PROD compartilham o mesmo client Google OAuth; DEV permanece local-only
- [ ] DNS de produção resolvendo corretamente
- [ ] Traefik ativo e com router da produção
- [ ] TLS/Let's Encrypt ativo
- [ ] Workflow de produção apontando para `main`
- [ ] Google OAuth Console com URIs autorizadas
- [ ] Credenciais OAuth de DEV não estão em GitHub environments

## Bootstrap técnico
- [ ] Aplicar migrations do ADM
- [ ] Aplicar migration do Better Auth
- [ ] Aplicar migrations do APP
- [ ] Aplicar migration de lots/FIFO, se aplicável
- [ ] Subir o container de produção
- [ ] Validar healthcheck

## Validação funcional
- [ ] `DOCTYPE` presente
- [ ] Auth bootstrap sem `AUTH_BOOTSTRAP_FAILED`
- [ ] Google OAuth bootstrap funcionando
- [ ] Login concluído com sessão
- [ ] `/subscribe` acessível
- [ ] `/app/accounts` acessível
- [ ] `/app/programs` acessível
- [ ] `/app/purchases` acessível
- [ ] Dashboard acessível

## Bootstrap do primeiro usuário
- [ ] Primeiro owner criado
- [ ] Primeira organização criada
- [ ] Conta/programa padrão criado
- [ ] Trial ativado
- [ ] Sessão preservada após reload

## Validação de dados
- [ ] Conectividade com `ADM_DATABASE_URL`
- [ ] Conectividade com `APP_DATABASE_URL`
- [ ] Sem herança de dados de DEV/HM
- [ ] Sem seeds de demo em produção real

## Rollback
- [ ] SHA anterior identificado
- [ ] Imagem estável identificada
- [ ] Processo de reverter deploy conhecido
- [ ] Snapshot do banco V2 disponível, se necessário
- [ ] Plano de retorno comunicado

## Critérios de aceite
- [ ] Login Google funcionando
- [ ] Sessão criada com sucesso
- [ ] Onboarding iniciado e concluído
- [ ] Trial ativável
- [ ] Rotas críticas respondendo
- [ ] Sem tela branca
- [ ] Sem erros de hidratação
- [ ] Sem `503` em auth
