# Changelog

All notable changes to this project will be documented in this file.

## [v1.1.4] - 22/07/2026
* **Refactor: isolar o FuturaSearchWidget em um Web Component / Shadow DOM ou escopar CSS para evitar poluição global de estilos (futura-widget.js:58-81)** `[G]` `[Backend]`
* **A11y: drag and drop de mensagens, problemas e links é exclusivo para mouse — sem suporte para acionamento via teclado (Space/Enter/Setas) (messages.js, problems.js, links.js)** `[G]` `[Accessibility]`
* **Refactor: portOpener.js concatena strings HTML complexas via template literal de 200+ linhas sem componente dinâmico ou sanitização estrita (portOpener.js:31-197)** `[M]` `[Backend]`

*(Nenhum item concluído neste ciclo ainda)*


## [v1.1.3] - 22/07/2026
* **Bug: FuturaSearchWidget cria duplo alternador de tema (#themeToggleBtn) que não sincroniza com o initTheme() global do PainelAtende (futura-widget.js:1306, theme.js)** `[M]` `[Bug]`
* **A11y: atalhos numéricos '1-4' e letras 'N', 'P' não são anunciados via aria-keyshortcuts nos botões de navegação/ação correspondentes (enhancements.js, shortcuts.js)** `[P]` `[Accessibility]`
* **UX: botão de exportar mensagens exibe modal mas não indica claramente qual o formato default recomendado via teclado/foco (messages.js:95-134)** `[P]` `[UI]`
* **Layout: painel de histórico de cópias não tem limitação de largura e causa estolamento em telas ultra-wide (history.js:57)** `[P]` `[Layout]`
* **Layout: modal de busca global (Ctrl+K) em telas pequenas (mobile/smartphones) ultrapassa altura e esconde caixa de input (search.css:16-24)** `[M]` `[Layout]`
* **Bug: FuturaSearchWidget em futura-widget.js reinjeta FontAwesome v6.5.2 e Google Fonts no <head> mesmo já existindo no index.html (futura-widget.js:18-45)** `[P]` `[Bug]`
* **Refactor: duplicar lógica de sanitizeHtml() / escapeHtml() entre utils.js e problemas.js — centralizar funções utilitárias (problems.js:671, utils.js)** `[P]` `[Backend]`
* **Bug: filtro de favoritos usa display:none/'' inline mas a busca global verifica style.display para visibilidade — conflito quando ambos estão ativos (enhancements.js)** `[M]` `[Bug]`
* **Bug: busca global (Ctrl+K) faz fetch ao Firestore a cada digitação sem cache local — N leituras por sessão e sem debounce suficiente (search.js:50-53)** `[M]` `[Bug]`
* **A11y: botões de ação nos cards de mensagem (editar, excluir, favoritar) não possuem aria-label — ilegíveis por screen readers (messages.js:347-348)** `[M]` `[Accessibility]`
* **A11y: .msg-content clicável usa div, não botão — invia Tab-navigation e não é acionável via Enter pelo teclado (messages.js:343)** `[M]` `[Accessibility]`
* **A11y: accordion-trigger nos problemas não possui aria-expanded nem aria-controls — estado aberto/fechado invisível para AT (problems.js:436)** `[M]` `[Accessibility]`
* **A11y: modal de busca global não prende foco (focus trap) — Tab navega para elementos da página de fundo (shortcuts.js, search.js)** `[M]` `[Accessibility]`
* **A11y: campo de tags em problema não possui label associado via for/id — label 'Tags' desassociado do input#problemTagInput (index.html:228)** `[P]` `[Accessibility]`
* **A11y: label 'Solução' (index.html:234) não tem atributo for — editor contenteditable #problemSolution não pode ser associado com label convencional, precisa de aria-labelledby** `[P]` `[Accessibility]`
* **A11y: tabs principais (#userArea .tabs) não usam role=tablist/tab/tabpanel — estrutura semântica incorreta para tecnologias assistivas (index.html:130)** `[M]` `[Accessibility]`
* **A11y: favicons de links externos carregados via Google S2 sem fallback acessível — onerror só oculta, sem alt text descritivo (links.js:158)** `[P]` `[Accessibility]`
* **UX: não há feedback de loading/disabled no botão de login durante a autenticação — usuário pode clicar múltiplas vezes (auth.js:135)** `[M]` `[UI]`
* **UX: formulário de novo link (index.html:283-285) não usa label+for nos campos URL, título e categoria — visualmente nu, sem orientação ao usuário** `[P]` `[UI]`
* **UX: formulário de edição inline de mensagens e links não suporta atalho Ctrl+Enter para salvar (messages.js:414, links.js:239)** `[P]` `[UI]`
* **Bug: FuturaSearchWidget possui botão #clearHistory com mesmo ID da history.js, podendo gerar colisões de listeners no DOM (futura-widget.js:1300, history.js)** `[P]` `[Bug]`
* **Bug: modal de alerta (#modalOverlay) possui botão OK sem id — quebra se houver múltiplas instâncias e é selecionado por querySelector frágil (modal.js:62)** `[P]` `[Bug]`
* **Bug: setupAutoTimeRefresh() em messages.js adiciona listener window 'focus' sem remover no resetMessages — mesmo problema de leak da auth.js** `[P]` `[Bug]`
* **Bug: import dinâmico de messages.js e problems.js no onAuthStateChanged sem necessidade — módulos já foram importados estaticamente (auth.js:97,106)** `[P]` `[Bug]`
* **Bug: listener 'focus' em window nunca é removido no logout — event listeners duplicados entre sessões (auth.js:279)** `[P]` `[Bug]`
* **Bug: headerTimeInterval nunca é limpo no logout — múltiplos intervalos acumulam entre sessões (auth.js:278)** `[P]` `[Bug]`
* **Bug: console.log de debug em renderMessages() vaza para produção (messages.js:244)** `[P]` `[Bug]`

*(Nenhum item concluído neste ciclo ainda)*


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
