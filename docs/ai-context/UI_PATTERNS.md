# UI_PATTERNS - VisioMilhas

Objetivo:

- Servir como referencia rapida para construir novas telas, modais, listas e estados operacionais com consistencia visual e de comportamento.

Base atual do sistema:

- `components/ui/dialog.tsx`
- `components/ui/table.tsx`
- `components/ui/toast.tsx`
- `components/accounts/account-list.tsx`
- `components/accounts/account-row.tsx`
- `components/accounts/account-actions-dropdown.tsx`

Diretriz geral:

- UI limpa, utilitaria e previsivel.
- Evitar padroes genericos demais; manter contraste suave, bordas leves e hierarquia visual clara.
- Preferir feedback imediato para acoes que alteram dados.

Modais e confirmacoes:

- Usar o `Dialog` padrao do projeto para confirmacoes, formulários e detalhes.
- Modais devem ter `DialogHeader`, `DialogTitle`, `DialogDescription` e `DialogFooter` quando aplicavel.
- Confirmacoes destrutivas devem explicar o efeito com linguagem curta e clara.
- Acoes de ativar/inativar/excluir nao devem usar `window.confirm`; devem usar modal da interface.
- Sempre que a acao alterar estado persistido, exibir feedback de sucesso ou erro.

Grafico visual e composicao:

- Cards com borda suave, fundo branco e sombra discreta.
- Titulos com contraste forte e descricoes curtas em tom secundario.
- Badges para status e contadores, com cores consistentes com o significado.
- Tabelas compactas para visoes operacionais; evitar linhas muito altas.
- Usar espacamento reduzido em listas para ganhar densidade sem perder leitura.

Padrao para listas e tabelas:

- Cabeçalho fixo conceitual com colunas nomeadas.
- Busca textual no topo quando a lista tiver mais de poucos itens.
- Filtro simples de status quando houver estados operacionais distintos.
- Coluna final para acoes, sempre alinhada a direita.
- Exibir programa, conta, saldo, CPM, status e data de atualizacao quando for contexto de contas.

Padrao para acoes:

- Acoes primarias devem ser visiveis e simples.
- Acoes secundarias devem ficar no dropdown de reticencias.
- A opcao exibida deve refletir o estado atual: conta ativa mostra `Inativar`; conta inativa mostra `Ativar`.
- A mudanca de status deve preservar saldo, CPM, apelido e demais campos do registro.

Toasts e feedback:

- Usar toast para sucesso, erro e informacoes curtas.
- Mensagens devem ser objetivas e escrever o que de fato aconteceu.
- Toast de erro deve dizer o motivo ou a impossibilidade da acao.
- Toast de sucesso deve confirmar a alteracao feita.

Acessibilidade:

- Garantir `aria-label` em botoes de acao sem texto.
- Manter contraste suficiente entre texto e fundo.
- Modal deve ser navegavel por teclado e fechar com Escape.
- Acoes criticas precisam de confirmacao clara antes de persistir.

Checklist rapido antes de criar uma nova tela:

- Existe modal ou confirmacao padrao para acao critica?
- A lista precisa de busca, filtro ou densidade maior?
- O feedback de sucesso/erro esta claro?
- Acoes destrutivas estao separadas das acoes neutras?
- A composicao visual segue card, tabela, badge e toast do sistema?
