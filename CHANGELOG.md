# Changelog

All notable changes to this project will be documented in this file.

## [v1.1.2] - 21/07/2026
* **Adicionar suporte ARIA (aria-live e aria-describedby) para mensagens de erro em formulários** `[P]` `[Accessibility]`
* **Melhorar contraste de bordas e cards no dark mode em search.css e compact-favorites.css** `[P]` `[UI]`
* **Persistir mapeamento de cores de tags em localStorage para consistência visual entre reloads** `[P]` `[UI]`
* **Adicionar suporte à tecla Escape para limpar a busca do header (#globalSearch)** `[P]` `[UI]`
* **Filtro dinâmico por horário na categoria Saudação (exibir 'Bom dia' antes das 12h e 'Boa tarde' após as 12h)** `[P]` `[UI]`

*(Nenhum item concluído neste ciclo ainda)*


## [v1.1.1] - 15/07/2026
* **Validar campos obrigatórios no formulário de login** `[P]` `[UI]`

*(Nenhum item concluído neste ciclo ainda)*


## [v1.1.0] - 15/07/2026

* **#1 — Tela de login com identidade visual** `[G]` `[UI/CSS]`
  - Adicionar logo/nome do sistema, subtítulo e fundo diferenciado (gradiente ou cor de marca)
  - Arquivo: `css/login.css`, `index.html`

* **#2 — Container mais largo** `[P]` `[Layout]`
  - Ampliar `max-width: 900px` → `1200px` ou usar `clamp()` para aproveitar telas grandes
  - Arquivo: `css/base.css`

* **#3 — Toolbar da aba Mensagens sem hierarquia** `[P]` `[UI]`
  - Separar botões secundários (Importar, Exportar, Histórico) do botão de ação principal (Nova mensagem) com `margin-left: auto`
  - Arquivo: `index.html`, `css/components.css`

* **#4 — Modal de exportação com 2 botões primary idênticos** `[M]` `[UX]`
  - Diferenciar visualmente TXT (`ghost`) e JSON (`primary`), adicionar descrições curtas sob cada botão
  - Arquivo: `index.html`, `css/components.css`

* **#B1 — `terminalFutura.js` ainda existe mas não é mais usado** `[P]` `[Refactor]`
  - O arquivo `js/terminalFutura.js` e `css/terminalFutura.css` ainda estão no projeto após a substituição pelo Futura Widget, gerando arquivos órfãos que ocupam espaço desnecessário (12KB+)
  - Ação: Remover `js/terminalFutura.js` e `css/terminalFutura.css` e o `<link>` do `terminalFutura.css` no `index.html`

* **#B2 — Atalho numérico `4` (Sistemas) não está em `enhancements.js`** `[P]` `[Bug]`
  - Em `enhancements.js` a função `setupNumericShortcuts()` só mapeia as teclas 1, 2, 3. O atalho para a aba Sistemas (tecla `4`) existe somente em `shortcuts.js`.
  - Arquivo: `js/enhancements.js` (adicionar `'4': 'tabSistemas'`)

* **#B3 — `messagesInitialized` e `problemsInitialized` nunca são resetados corretamente no logout** `[M]` `[Bug]`
  - Em `auth.js`, ao fazer logout, `messagesInitialized = false` e `problemsInitialized = false` são resetados — mas as listas do DOM (`msgList`, `problemList`) ficam limpas via `innerHTML = ''`. Porém, `linksInitialized` equivalente não existe — na próxima vez que logar, `initLinks` é chamado novamente, mas `uiInitialized` em `links.js` ainda é `true`. `resetLinks()` só reseta `currentUserId` e `uiInitialized`, não limpa a lista visual `#linkList`.
  - Arquivo: `js/links.js` (função `resetLinks` deve limpar `el('linkList').innerHTML`)

* **#B4 — `exportToJson` inclui `deleted` e `order` mas exclui apenas `id`, `createdAt`, `updatedAt`** `[P]` `[Bug]`
  - Na linha 419 de `messages.js`: `const exportData = allMessages.map(({ id, createdAt, updatedAt, ...rest }) => rest)` — `allMessages` só contém mensagens com `deleted: false`, então o campo `deleted` exportado sempre será `false` — isso é redundante no backup. Também exporta `order` que pode causar conflito ao importar em outra conta. Seria mais limpo exportar apenas: `text`, `title`, `category`.
  - Arquivo: `js/messages.js` (filtrar campos exportados)

* **#B5 — `saveOrder` em `messages.js` pode falhar silenciosamente quando o drag cruza grupos de categoria** `[M]` `[Bug]`
  - O drag-and-drop de mensagens funciona por grupo de categoria. Se o usuário arrastar uma mensagem para outro grupo, o DOM move o item mas a `category` no Firestore não é atualizada — apenas o `order` é salvo.
  - Arquivo: `js/messages.js` (ao salvar a ordem, também atualizar a `category` baseada no grupo onde o item ficou)

* **#B6 — Busca em `enhancements.js` usa `#globalSearch` que não existe no HTML** `[P]` `[Bug]`
  - Em `enhancements.js` linha 50: `const input = el('globalSearch')` — mas no HTML o input da busca no header não tem `id="globalSearch"`. A busca inline do header (`Ctrl+F`) estava quebrada.
  - Arquivo: `index.html` (adicionar seletor e funcionalidade)

* **#B7 — Favorites são armazenados em `localStorage` por ID do Firestore** `[P]` `[Bug]`
  - Os favoritos deveriam ser prefixados com o `userId` para evitar conflito de chaves em contas compartilhadas na mesma máquina.
  - Arquivo: `js/enhancements.js` (prefixar a chave: `favorites_${userId}`)

* **#B8 — `problem-copy-field:hover` usa cor hardcoded `#eff6ff` não compatível com dark mode** `[P]` `[CSS]`
  - Em `problems.css` linha 47: `.solution-copy-field:hover { background: #eff6ff; }` — essa cor é um azul claro que não funciona em dark mode.
  - Arquivo: `css/problems.css` (substituir por `--primary-light`)

* **#5 — Header sem hierarquia clara** `[M]` `[UI]`
  - Adicionar avatar/inicial do usuário logado como pill/badge e destacar o botão "Sair".
  - Arquivos: `index.html`, `css/base.css`

* **#6 — Badge de contagem exibindo "0" nas abas** `[P]` `[UI/JS]`
  - Ocultar badge quando o valor for zero ou vazio.
  - Arquivo: `js/enhancements.js` na função `updateBadge`

* **#7 — Abas sem responsividade em mobile** `[M]` `[Layout]`
  - Em telas `< 640px`, exibir apenas ícones nas abas (ocultar texto de descrição).
  - Arquivo: `css/components.css`

* **#8 — Botão "Ver Lixeira" fixo na tela indevidamente** `[P]` `[UI]`
  - Remover `position: fixed` e manter o botão estático na interface.
  - Arquivo: `css/base.css`, `index.html`

* **#9 — Widget Futura não respeita o dark mode** `[M]` `[Integration]`
  - Injetar dinamicamente a classe do tema no container e atualizar variáveis CSS.
  - Arquivos: `js/portOpener.js`, `css/portOpener.css`

* **#10 — Empty state com ícone nas listas** `[M]` `[UX/UI]`
  - Exibir visual estilizado com ícone descritivo quando não existirem mensagens ou problemas salvos.
  - Arquivos: `js/messages.js`, `js/problems.js`, `css/components.css`

* **#11 — Botão "Sair" com confirmação no modal** `[M]` `[UX]`
  - Exibir modal de confirmação antes de deslogar o usuário do painel.
  - Arquivo: `js/auth.js`

* **#12 — Inputs com labels visíveis ou floating labels** `[M]` `[Accessibility]`
  - Adicionar labels claros aos inputs para melhorar acessibilidade.
  - Arquivo: `index.html`, `css/forms.css`

* **#13 — Sem feedback de loading ao carregar dados do Firebase** `[M]` `[UX]`
  - Mostrar feedback visual animado de "carregando" enquanto busca dados do Firestore.
  - Arquivos: `js/messages.js`, `js/problems.js`, `css/components.css`

* **#14 — Estado ativo (.active) no botão de modo compacto** `[P]` `[UI/JS]`
  - Aplicar destaque visual (.active) no botão quando o modo compacto estiver ligado.
  - Arquivos: `js/enhancements.js`, `css/forms.css`

* **#15 — Deletar links do usuário ao excluí-lo no painel de admin** `[P]` `[Backend]`
  - Deletar a subcoleção `links` no Firestore quando um usuário for apagado pelo admin.
  - Arquivo: `js/admin.js`

* **#16 — Indicador de limite no histórico de cópias** `[M]` `[UX/JS]`
  - Exibir contador `X / 20` indicando o limite de armazenamento no histórico.
  - Arquivo: `js/history.js`

* **#17 — Variável para cor da solução `.solution-text`** `[P]` `[CSS]`
  - Criar variável de tema para a cor do texto de solução em vez do valor verde hardcoded.
  - Arquivo: `css/problems.css`, `css/base.css`
