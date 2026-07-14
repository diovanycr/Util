# 📋 Backlog — PainelAtende

Tarefas de melhoria UX/UI identificadas na análise de 14/07/2026.
Marcar como `[x]` quando concluída.

---

## 🔴 Críticas

- [ ] **#1 — Tela de login com identidade visual**
  - Adicionar logo/nome do sistema, subtítulo e fundo diferenciado (gradiente ou cor de marca)
  - Arquivo: `css/login.css`, `index.html`

- [ ] **#2 — Container mais largo**
  - Ampliar `max-width: 900px` → `1200px` ou usar `clamp()` para aproveitar telas grandes
  - Arquivo: `css/base.css`

- [ ] **#3 — Toolbar da aba Mensagens sem hierarquia**
  - Separar botões secundários (Importar, Exportar) do botão de ação principal (Nova mensagem) com `margin-left: auto`
  - Arquivo: `index.html`, `css/components.css`

- [ ] **#4 — Modal de exportação com 2 botões primary idênticos**
  - Diferenciar visualmente TXT (`ghost`) e JSON (`primary`), adicionar descrições curtas sob cada botão
  - Arquivo: `index.html`, `css/components.css`

---

## 🟡 Importantes

- [ ] **#5 — Header sem hierarquia clara**
  - Adicionar avatar/inicial do usuário logado como pill/badge
  - Separar visualmente o botão "Sair" dos demais botões do header
  - Arquivo: `index.html`, `css/base.css`

- [ ] **#6 — Badge de contagem exibindo "0" nas abas**
  - Ocultar badge quando valor for 0 (via JS ou CSS)
  - Arquivo: `js/app.js` ou CSS com `:empty`

- [ ] **#7 — Abas sem responsividade em mobile**
  - Em telas `< 640px`, exibir apenas ícone nas abas (remover texto), mantendo `title` para tooltip
  - Arquivo: `css/components.css`

- [ ] **#8 — Botão "Ver Lixeira" fixo na tela indevidamente**
  - Remover `position: fixed` do `.center.mt-12` ou mover o botão para a toolbar
  - Arquivo: `css/base.css`, `index.html`

- [ ] **#9 — Futura Widget não respeita o dark mode do app**
  - Ao inicializar o widget, injetar a classe do tema atual no container
  - Sobrescrever variáveis CSS do widget para seguir o tema do app
  - Arquivo: `js/portOpener.js`, `css/portOpener.css`

---

## 🟢 Polimento

- [ ] **#10 — Empty state ausente nas listas**
  - Quando não há mensagens/problemas/links, mostrar ícone + texto orientativo
  - Arquivo: `js/messages.js`, `js/problems.js`, `js/links.js`

- [ ] **#11 — Botão "Sair" sem confirmação**
  - Usar o `confirmModal` já existente antes de chamar o logout
  - Arquivo: `js/auth.js` ou `js/app.js`

- [ ] **#12 — Inputs sem label visual (acessibilidade)**
  - Adicionar `<label>` visíveis ou floating labels nos formulários principais
  - Arquivo: `index.html`, `css/forms.css`

- [ ] **#13 — Sem feedback de loading ao carregar dados do Firebase**
  - Adicionar spinner ou skeleton screen enquanto os dados chegam do Firestore
  - Arquivo: `js/messages.js`, `js/problems.js`, `css/components.css`

- [ ] **#14 — Modo compacto sem indicação de estado ativo**
  - Adicionar classe `.active` e trocar ícone (`fa-compress` → `fa-expand`) quando ativo
  - Arquivo: `js/app.js`, `css/forms.css`

---

## ✅ Concluídas

*(nenhuma ainda)*
