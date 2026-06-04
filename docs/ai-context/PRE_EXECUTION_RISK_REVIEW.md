# Pre-Execution Risk Review

**Status:** BLOCKED_BY_RISK

## Objetivo
Revisão independente dos artefatos de arquitetura e operação antes da implantação de HM e do futuro cutover de PROD V2.

## Artefatos revisados
- `ENVIRONMENT_SEGREGATION_PLAN.md`
- `HM_INFRASTRUCTURE_CHECKLIST.md`
- `HM_DEPLOYMENT_SEQUENCE.md`
- `HM_VALIDATION_SEQUENCE.md`
- `PROD_V2_CUTOVER_PLAN.md`
- `PROD_V2_GO_LIVE_CHECKLIST.md`
- `TECHNICAL_DEBT_AUDIT.md`
- `ARCHITECTURE_RISKS.md`
- `RUNBOOK.md`
- `INCIDENT_RESPONSE.md`

## Classificação geral dos riscos

### CRITICAL
- **Google OAuth Console ainda é uma dependência humana manual** para HM e PROD. Se os redirect URIs e origins não estiverem cadastrados antes do deploy, o login falha em produção mesmo com o código correto.
- **PROD V2 depende de bootstrap em banco vazio**. Se a ordem das migrations, Better Auth e bootstrap runtime não estiver perfeitamente alinhada, o ambiente sobe parcialmente ou quebra no primeiro login.

### HIGH
- **Better Auth em banco vazio**: se as tabelas `ba_users`, `ba_sessions`, `ba_accounts` e `ba_verification` não estiverem materializadas na hora certa, o bootstrap de auth retorna `AUTH_BOOTSTRAP_FAILED` ou comportamento equivalente.
- **HM compartilha infraestrutura atual** com DEV em bases já existentes. Isso aumenta o risco de contaminação operacional, confusão de ambiente e validação com dados não representativos.
- **Workflows concorrentes ou legados** ainda são risco operacional quando há mais de um caminho de deploy histórico no repositório. Mesmo que o caminho novo seja o oficial, o legado precisa estar claramente arquivado.

### MEDIUM
- **Traefik**: o roteamento por host e a rede pública precisam estar corretos para HM e PROD; qualquer drift entre labels, hostnames e certificados vira indisponibilidade pública.
- **Secrets GitHub**: qualquer valor ausente, vazio ou apontando para o environment errado quebra deploy ou runtime de auth/database.
- **Rollback**: está documentado, mas continua dependente de operação disciplinada e de imagem/sha estáveis. Sem rotina de rollback ensaiada, o tempo de recuperação aumenta.
- **GitHub Actions**: os workflows possuem gates e smoke tests, mas a execução real em HM/PROD ainda depende da qualidade do environment, da rede e das secrets.

### LOW
- **Warnings de frontend** como `<img>` seguem como dívida técnica, mas não são bloqueantes para o cutover.
- **Drift documental histórico** pode confundir novos operadores, embora não impeça a execução técnica.

## O que tem mais chance de falhar se HM começar amanhã?

1. **Google OAuth manual** não concluído para o hostname de HM.
2. **DNS/TLS/Traefik** de HM não totalmente propagados ou alinhados.
3. **Secrets do environment de HM** incompletas ou apontando para o conjunto errado.
4. **Validação funcional com dados compartilhados** gerar falso positivo ou comportamento não representativo.
5. **Conflito operacional com workflows legados** caso haja dúvida sobre qual pipeline é o oficial.

## O que tem mais chance de falhar se PROD V2 começar amanhã?

1. **Bootstrap do banco vazio** não seguir a ordem correta.
2. **Better Auth** falhar por tabela ausente, migration incompleta ou secret vazia.
3. **Google OAuth** falhar por redirect URI/origin ausente ou client errado.
4. **Conectividade dupla** entre `ADM_DATABASE_URL` e `APP_DATABASE_URL` apontando para alvos incorretos.
5. **Rollback** ser mais lento do que o desejado se a imagem/sha estável não estiver claramente identificado e ensaiado.

## Dependências esquecidas ou subestimadas
- Google OAuth Console manual para HM e PROD.
- Conferência real de DNS/TLS/Traefik antes do primeiro teste público.
- Materialização das tabelas do Better Auth no banco ADM vazio.
- Bootstrap runtime do primeiro owner/organização/trial.
- Disciplina para evitar uso do workflow legado como caminho paralelo.

## Riscos específicos por área

### OAuth
- Redirect URI correto no código não basta; o console precisa estar sincronizado.
- HM e PROD compartilham o mesmo client OAuth, então qualquer ajuste deve considerar os dois hosts.

### Better Auth
- Banco vazio sem tabelas de auth.
- Secret vazio ou environment errado.
- Bootstrap esperado no primeiro login sem fallback operacional.

### Banco vazio
- Migrações em ordem errada.
- Falta de bootstrap de owner/organization.
- Tabela de lots/FIFO ausente se o fluxo operacional precisar dela.

### Traefik
- Router por host incorreto.
- Certificado não emitido.
- Rede pública não conectada.

### GitHub Actions
- Secrets de environment faltantes.
- Dois workflows competindo com o mesmo objetivo.
- Smoke tests não executados de forma representativa no ambiente-alvo.

### Secrets
- `BETTER_AUTH_SECRET` vazio.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` do ambiente errado.
- `ADM_DATABASE_URL` / `APP_DATABASE_URL` apontando para bancos incorretos.

## Conclusão

### Se eu iniciar HM amanhã
O ponto mais provável de falha é o **Google OAuth manual** combinado com **DNS/TLS/Traefik** ainda não completamente conferidos no ambiente de homologação.

### Se eu iniciar PROD V2 amanhã
O ponto mais provável de falha é o **bootstrap do banco vazio**, especialmente a interação entre **Better Auth**, **migrations do ADM/APP** e **secrets corretas**.

## Recomendação
- HM ainda precisa de confirmação operacional humana antes de ser tratado como pronto para execução.
- PROD V2 ainda precisa de um ensaio controlado de bootstrap com banco vazio antes do go-live real.

