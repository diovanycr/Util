# 📋 Backlog — PainelAtende

Tarefas de melhoria UX/UI e bugs identificados nas análises de 14/07/2026.
Marcar como `[x]` quando concluída.

---

## 🔴 Críticas

- [x] **#1 — Tela de login com identidade visual**
  - Adicionar logo/nome do sistema, subtítulo e fundo diferenciado (gradiente ou cor de marca)
  - Arquivo: `css/login.css`, `index.html`

- [x] **#2 — Container mais largo**
  - Ampliar `max-width: 900px` → `1200px` ou usar `clamp()` para aproveitar telas grandes
  - Arquivo: `css/base.css`

- [x] **#3 — Toolbar da aba Mensagens sem hierarquia**
  - Separar botões secundários (Importar, Exportar, Histórico) do botão de ação principal (Nova mensagem) com `margin-left: auto`
  - Arquivo: `index.html`, `css/components.css`

- [x] **#4 — Modal de exportação com 2 botões primary idênticos**
  - Diferenciar visualmente TXT (`ghost`) e JSON (`primary`), adicionar descrições curtas sob cada botão
  - Arquivo: `index.html`, `css/components.css`

---

## 🐛 Bugs

- [x] **#B1 — `terminalFutura.js` ainda existe mas não é mais usado**
  - O arquivo `js/terminalFutura.js` e `css/terminalFutura.css` ainda estão no projeto após a substituição pelo Futura Widget, gerando arquivos órfãos que ocupam espaço desnecessário (12KB+)
  - Ação: Remover `js/terminalFutura.js` e `css/terminalFutura.css` e o `<link>` do `terminalFutura.css` no `index.html`

- [x] **#B2 — Atalho numérico `4` (Sistemas) não está em `enhancements.js`**
  - Em `enhancements.js` a função `setupNumericShortcuts()` só mapeia as teclas 1, 2, 3 (linha 378-388). O atalho para a aba Sistemas (tecla `4`) existe somente em `shortcuts.js`. São dois listeners de teclado duplicados fazendo coisas parecidas, e o `4` falta em um deles.
  - Arquivo: `js/enhancements.js` (adicionar `'4': 'tabSistemas'`)

- [x] **#B3 — `messagesInitialized` e `problemsInitialized` nunca são resetados corretamente no logout**
  - Em `auth.js`, ao fazer logout, `messagesInitialized = false` e `problemsInitialized = false` são resetados — mas as listas do DOM (`msgList`, `problemList`) ficam limpas via `innerHTML = ''`. Porém, `linksInitialized` equivalente não existe — na próxima vez que logar, `initLinks` é chamado novamente, mas `uiInitialized` em `links.js` ainda é `true` (é variável de módulo), impedindo setup duplicado. Isso é correto. Porém, `resetLinks()` só reseta `currentUserId` e `uiInitialized`, não limpa a lista visual `#linkList`. Ao trocar de conta, links antigos podem aparecer brevemente.
  - Arquivo: `js/links.js` (função `resetLinks` deve limpar `el('linkList').innerHTML`)

- [x] **#B4 — `exportToJson` inclui `deleted` e `order` mas exclui apenas `id`, `createdAt`, `updatedAt`**
  - Na linha 419 de `messages.js`: `const exportData = allMessages.map(({ id, createdAt, updatedAt, ...rest }) => rest)` — `allMessages` só contém mensagens com `deleted: false`, então o campo `deleted` exportado sempre será `false` — isso é redundante no backup. Também exporta `order` que pode causar conflito ao importar em outra conta. Seria mais limpo exportar apenas: `text`, `title`, `category`.
  - Arquivo: `js/messages.js` (filtrar campos exportados)

- [x] **#B5 — `saveOrder` em `messages.js` pode falhar silenciosamente quando o drag cruza grupos de categoria**
  - O drag-and-drop de mensagens funciona por grupo de categoria. Se o usuário arrastar uma mensagem para outro grupo, o DOM move o item mas a `category` no Firestore não é atualizada — apenas o `order` é salvo. Após reload, a mensagem volta para a categoria original.
  - Arquivo: `js/messages.js` (ao salvar a ordem, também atualizar a `category` baseada no grupo onde o item ficou)

- [x] **#B6 — Busca em `enhancements.js` usa `#globalSearch` que não existe no HTML**
  - Em `enhancements.js` linha 50: `const input = el('globalSearch')` — mas no HTML o input da busca no header não tem `id="globalSearch"`. A busca inline do header (`Ctrl+F`) está quebrada.
  - Verificar: pode ser que essa barra de busca foi removida ou renomeada. Checar no `index.html` se existe o campo.

- [x] **#B7 — Favorites são armazenados em `localStorage` por ID do Firestore**
  - Se um usuário tem o mesmo ID de documento em outro contexto (improvável mas possível), os favoritos de um usuário podem vazar para outro. Os favoritos deveriam ser prefixados com o `userId`.
  - Arquivo: `js/enhancements.js` (prefixar a chave: `favorites_${userId}`)

- [x] **#B8 — `problem-copy-field:hover` usa cor hardcoded `#eff6ff` não compatível com dark mode**
  - Em `problems.css` linha 47: `.solution-copy-field:hover { background: #eff6ff; }` — essa cor é um azul claro que não funciona em dark mode. O dark mode sobrescreve corretamente, mas seria melhor usar uma variável.
  - Arquivo: `css/problems.css`

---

## 🟡 Importantes

- [x] **#5 — Header sem hierarquia clara**
  - Adicionar avatar/inicial do usuário logado como pill/badge
  - Separar visualmente o botão "Sair" dos demais botões do header
  - Arquivo: `index.html`, `css/base.css`

- [x] **#6 — Badge de contagem exibindo "0" nas abas**
  - Ocultar badge quando valor for 0 (via JS ou CSS)
  - Arquivo: `js/enhancements.js` função `updateBadge`

- [x] **#7 — Abas sem responsividade em mobile**
  - Em telas `< 640px`, exibir apenas ícone nas abas (remover texto), mantendo `title` para tooltip
  - Arquivo: `css/components.css`

- [x] **#8 — Botão "Ver Lixeira" fixo na tela indevidamente**
  - Remover `position: fixed` do `.center.mt-12` ou mover o botão para a toolbar
  - Arquivo: `css/base.css`, `index.html`

- [x] **#9 — Futura Widget não respeita o dark mode do app**
  - Ao inicializar o widget, injetar a classe do tema atual no container
  - Sobrescrever variáveis CSS do widget para seguir o tema do app
  - Arquivo: `js/portOpener.js`, `css/portOpener.css`

---

## 🟢 Polimento

- [x] **#10 — Empty state ausente nas listas (Mensagens e Problemas)**
  - As listas de mensagens e problemas mostram apenas texto simples sem ícone orientativo
  - Arquivo: `js/messages.js` (linha 204), `js/problems.js`

- [x] **#11 — Botão "Sair" sem confirmação**
  - Usar o `confirmModal` já existente antes de chamar o logout
  - Arquivo: `js/auth.js` (linha 35-41)

- [x] **#12 — Inputs sem label visual (acessibilidade)**
  - Adicionar `<label>` visíveis ou floating labels nos formulários principais
  - Arquivo: `index.html`, `css/forms.css`

- [x] **#13 — Sem feedback de loading ao carregar dados do Firebase**
  - Adicionar spinner ou skeleton screen enquanto os dados chegam do Firestore
  - Arquivo: `js/messages.js`, `js/problems.js`, `css/components.css`

- [x] **#14 — Modo compacto sem indicação de estado ativo no botão**
  - O ícone já muda (`fa-compress` → `fa-expand`) mas o botão não recebe uma classe `.active` visível
  - Arquivo: `js/enhancements.js` (linha 184-200), `css/forms.css`

- [x] **#15 — Admin: exclusão de usuário não deleta links no Firestore**
  - Em `admin.js` linha 104-110: ao excluir um usuário, o código apaga mensagens e problemas, mas **não apaga a subcoleção `links`**, deixando dados órfãos no Firestore
  - Arquivo: `js/admin.js` (função `btnDelete`, adicionar `linksSnap`)

- [x] **#16 — Histórico de cópias limita a 20 itens mas nunca notifica o usuário**
  - Quando o histórico atinge 20 itens, os mais antigos são silenciosamente removidos sem feedback
  - Arquivo: `js/history.js` (mostrar indicador "Máximo de 20 itens")

- [x] **#17 — `problems.css` usa cor hardcoded `#166534` para `.solution-text`**
  - A cor do texto de solução é hardcoded (`color: #166534`) e não usa variável CSS — não se adapta em possíveis customizações futuras
  - Arquivo: `css/problems.css` (linha 24)

---

## ✅ Concluídas

- Todas as tarefas (Críticas, Bugs, Importantes e Polimento) foram 100% implementadas, testadas e refinadas!
