# Backlog

> 💡 **Dica de uso:** Você pode gerenciar este backlog via terminal com o script:
> * Adicionar tarefa: `node scripts/backlog.js add "Título da tarefa" --size M --scope UI`
> * Concluir tarefa: `node scripts/backlog.js done "Trecho do título"`
> * Nova release: `node scripts/backlog.js release v1.2.0`
> * **Gerar changelog e limpar backlog:** `node scripts/backlog.js changelog` (este comando extrai os itens concluídos, adiciona-os no topo do `CHANGELOG.md` e limpa a seção **Feito** automaticamente).
>
> **Tags padrão:** Tamanhos `[P]`, `[M]`, `[G]` | Escopos `[UI]`, `[Bug]`, `[Layout]`, `[Backend]`, `[Accessibility]`


## 📍 Estado atual
Última sessão: Implementados 9 itens `[M]`/`[P]` — paginação em loadUsers, filtros de categoria/links sem re-renderizar DOM, dark mode em components.css e login.css, focus trap no modal do FuturaSearchWidget, localStorage do widget por usuário, anti-acúmulo de listeners globais. Total de 29 itens concluídos neste ciclo.
Próximo passo: Refatorar o monolito `futura-widget.js` (2198 linhas) em módulos ES6 e avaliar as 9 ferramentas novas (ESC/POS, validadores fiscais, etc.).

## ⚠️ Decisões pendentes
- Contatos reais de suporte (WhatsApp/e-mail) no painel de Ajuda.
- Escopo da Cloud Function para exclusão completa de usuário no Firebase Auth.

## 🐛 Bugs conhecidos
*(Nenhum bug conhecido no momento — auditoria recente confirmou falsos positivos e corrigiu os reais)*

---

## Em andamento

*(Nenhum item em andamento)*

## Próximo
- [ ] **Refatorar: futura-widget.js 2198 linhas como IIFE gigante com proxy document/window - quebrar em metodos de classe nomeados** `[G]` `[Backend]`
- [ ] **A11y: shortcuts.js buscard resultados nao seta aria-activedescendant/aria-selected ao navegar com setas - leitores nao anunciam item destacado** `[M]` `[Accessibility]`
- [ ] **Bug: theme.js initTheme apos DOMContentLoaded causa flash de tema errado (FOUC) - comment diz que previne mas o call e deferido** `[M]` `[UI]`
- [ ] **Bug: enhancements.js copyFirstResult chama navigator.clipboard.writeText sem await/catch - toast 'Copiado!' aparece mesmo quando falha** `[P]` `[Bug]`
- [ ] **Bug: shortcuts.js _searchIndex desincroniza quando results re-renderizam async (debounce 200ms) - TypeError ao apertar seta durante re-render** `[P]` `[Bug]`
- [ ] **Bug: modal.js callback async (confirm/cancel) sem try/catch - rejeicao nao tratada deixa modal preso e callback permanente** `[M]` `[Bug]`
- [ ] **Bug: links.js enterEditMode destroi star de favoritos/edit/del via innerHTML - se loadLinks falhar apos save, card trava em edit form** `[M]` `[Bug]`
- [ ] **Bug: links.js drag cross-group move DOM mas nao persiste category - usuario acha que re-categorizou mas volta ao recarregar (silencioso)** `[M]` `[Bug]`
*(Nenhum item pendente)*



## Feito
- [x] **Bug: futura-widget.js escapeQ() e no-op (cada replace troca char por ele mesmo) - nao escapa aspas/angle brackets em atributo data-query** `[P]` `[Bug]`
- [x] **Bug: futura-widget.js renderResults injeta title/description/link da API Gemini sem escape (XSS em AI data)** `[M]` `[Bug]`
- [x] **Bug: futura-widget.js showProviderChoice injeta query do usuario sem escape no prompt preview (XSS via voz/quick-tag)** `[M]` `[Bug]`
- [x] **Bug: futura-widget.js loadDependencies() async nunca aguardado - search roda antes de marked/DOMPurify carregarem, cai em fallback vulneravel** `[M]` `[Bug]`
- [x] **Bug: escPos.js regex de variável captura comentários Python (# comentário) como variável** `[P]` `[Bug]`
- [x] **Bug: apiTester.js listener duplicado no btnSend - envia requisição 2x (duplicate event handler)** `[P]` `[Bug]`
- [x] **Bug: fileValidator.js Destinatário lê CNPJ do emitente em vez do destino** `[P]` `[Bug]`
- [x] **Refatorar: problems.js com 719 linhas misturando UI/render/tags/editor/dnd - quebrar em módulos** `[G]` `[Backend]`
- [x] **Modal de alerta/confirmação não implementa focus trap completo (foco pode vazar para background)** `[M]` `[Accessibility]`
- [x] **Contenteditable #problemSolution sem role=textbox e aria-multiline para leitores de tela** `[M]` `[Accessibility]`
- [x] **Abas não suportam navegação por setas (ArrowLeft/Right) entre tabs, apenas click/Enter** `[M]` `[Accessibility]`
- [x] **Backend: import de problemas não deduplica por título - gera lista com mesmos títulos** `[P]` `[Backend]`
- [x] **Contador #trashCount e badges de aba sem aria-live para anunciar mudanças dinâmicas** `[P]` `[Accessibility]`
- [x] **Refatorar: lógica de saudação por horário (Bom dia/tarde/noite) duplicada em messages.js renderMessages e isGreeting - extrair para utils.js** `[P]` `[Backend]`
- [x] **Bug: FuturaSearchWidget mock addEventListener no IIFE chama document.removeEventListener() antes de addEventListener() - remove listeners legítimos** `[G]` `[Bug]`
- [x] **Busca global (Ctrl+K) abre modal mas não foca automaticamente no input ao abrir** `[P]` `[UI]`
- [x] **Botões sem type=button no HTML causam submissão acidental de formulários (default submit em <form>)** `[P]` `[Accessibility]`
- [x] **A11y: tabs.js não implementa padrão ARIA completo - falta role=tablist/tab/tabpanel com aria-controls** `[M]` `[Accessibility]`
- [x] **Refatorar: enhancements.js usa input.oninput/onkeydown (sobrescreve) em vez de addEventListener - listeners perdidos em multi-init** `[P]` `[Bug]`
- [x] **UX: mensagens na lixeira sem botão de exclusão definitiva individual - só 'Esvaziar lixeira' deleta** `[P]` `[UI]`
- [x] **Bug: rich-editor aceita qualquer imagem como dataURL base64 - 10MB vira string de 13MB no Firestore (doc max 1MB)** `[G]` `[Bug]`
- [x] **UX: nenhum feedback de progresso durante emptyTrash em mensagens - usuário não sabe se processo está rodando** `[P]` `[UI]`
- [x] **Backend: loadProblems sem paginação - getDocs de toda coleção degrada performance em bases grandes** `[M]` `[Backend]`
- [x] **Bug: openSearch em shortcuts.js registra listener de input a cada abertura - vazamento de listeners (ainda pendente após refatoração anterior)** `[P]` `[Bug]`
- [x] **Backend: saveOrder usa writeBatch mas reescreve TODAS as rows mesmo as que não mudaram - pesado em reordenação grande** `[P]` `[Backend]`
- [x] **Cores hardcoded em problems.css/tags.css/compact-favorites.css/help.css em vez de variáveis CSS - dark mode inconsistente** `[M]` `[Layout]`
- [x] **UX: import de arquivo grande não mostra progresso - batch em chunks de 500 sem feedback X de Y** `[M]` `[UI]`
- [x] **Refatorar: exportToTxt e exportToJson quase idênticos - extrair helper exportAsFile(content, filename, mimeType)** `[P]` `[UI]`
- [x] **Refatorar: search.js reimplementa escapeHtml em highlight() - utils.js já exporta escapeHtml - duplicação** `[P]` `[Backend]`
- [x] **Race condition: loadMessages async pode ser disparado várias vezes (clique duplo em Editar/Salvar) gerando render inconsistente** `[M]` `[Bug]`
- [x] **UX: emptyTrash deleta vários docs sem desabilitar botão nem spinner - usuário pode clicar várias vezes** `[P]` `[UI]`
- [x] **Bug: seed inicial de saudações usa localStorage flag - se usuário limpar localStorage as saudações duplicam - usar query Firestore** `[P]` `[Bug]`
- [x] **UX: btnCreateUser finally sempre define innerHTML='Criar usuário' mesmo se texto era outro - perde estado original** `[P]` `[UI]`
- [x] **Admin não valida username/email únicos antes de criar usuário - pode haver duplicatas comprometendo login** `[M]` `[Bug]`
- [x] **Bug: username lookup em doLogin usa snap.docs[0] sem validar unicidade - duplicatas permitem autenticar com email arbitrário** `[M]` `[Bug]`
- [x] **A11y: enterEditMode foca em .edit-msg-text sem anunciar contexto (sem aria-label/aria-describedby) ao screen reader** `[P]` `[Accessibility]`
- [x] **Bug: futura-widget.js loadDependencies() não aguarda onload de marked/DOMPurify - falha silenciosa em CDNs lentos** `[M]` `[Bug]`
- [x] **Refatorar: enhancements.js usa compactMode no localStorage sem prefixo de usuário - vaza entre contas no mesmo browser** `[M]` `[Bug]`
- [x] **Refatorar: FuturaSearchWidget injeta ~1300 linhas de CSS inline a cada instância sem cache - mover para arquivo .css compartilhado** `[M]` `[Backend]`
- [x] **A11y: .modal-overlay sem role=dialog/aria-modal/aria-labelledby em modal.js - screen readers não reconhecem como diálogo** `[P]` `[Accessibility]`
- [x] **Bug: searchCache Map em futura-widget.js cresce sem limite (memory leak) - sem LRU, max-size ou TTL** `[M]` `[Bug]`
- [x] **UX: loading state ausente em enterEditMode/saveEdit de problems - nenhum feedback durante gravação** `[P]` `[UI]`
- [x] **Layout: :hover sem :focus-visible em .tag-filter-chip, .solution-copy-field, .help-tab, .accordion-trigger - teclado sem feedback visual** `[P]` `[Layout]`
- [x] **Backend: deleteDoc do admin não é atômico - Promise.all com deleteDoc individuais deixa estado parcial se uma falha** `[M]` `[Backend]`
- [x] **Refatorar: futura-widget.js duplica showToast (existe em toast.js) e initTheme/toggleTheme (existe em theme.js) - usar módulos compartilhados** `[P]` `[Backend]`

*(Nenhum item concluído neste ciclo ainda)*

---

## Ideias (não priorizado)
- [ ] Gráfico com estatísticas das mensagens copiadas mais frequentemente `[M]` `[Estatísticas]`
- [ ] Envio de backups automáticos por email `[G]` `[Integração]`
