# Backlog

> 💡 **Dica de uso:** Você pode gerenciar este backlog via terminal com o script:
> * Adicionar tarefa: `node scripts/backlog.js add "Título da tarefa" --size M --scope UI`
> * Concluir tarefa: `node scripts/backlog.js done "Trecho do título"`
> * Nova release: `node scripts/backlog.js release v1.2.0`
> * **Gerar changelog e limpar backlog:** `node scripts/backlog.js changelog` (este comando extrai os itens concluídos, adiciona-os no topo do `CHANGELOG.md` e limpa a seção **Feito** automaticamente).
>
> **Tags padrão:** Tamanhos `[P]`, `[M]`, `[G]` | Escopos `[UI]`, `[Bug]`, `[Layout]`, `[Backend]`, `[Accessibility]`


## 📍 Estado atual
Última sessão: Auditoria completa do código (40 arquivos JS/CSS/HTML) via 4 agentes paralelos. 59 novos itens adicionados ao backlog (2 G, 21 M, 36 P): bugs de segurança (XSS em portOpener/decisionTree/statusChecker), bugs de estado (resetState/resetLinks/resetProblems vazam entre usuários), listener leaks (futura-widget destroy/re-init), race conditions (btnAddMsg, performSearch), A11y (combobox/listbox/aria-label faltando), layout (widget height 800px sem responsivo, select option white em dark) e refatorações (drag-and-drop triplicado, badges divergentes). Próximo: implementar.

## ⚠️ Decisões pendentes
- Contatos reais de suporte (WhatsApp/e-mail) no painel de Ajuda.
- Escopo da Cloud Function para exclusão completa de usuário no Firebase Auth.

## 🐛 Bugs conhecidos
*(Nenhum bug conhecido no momento — auditoria recente confirmou falsos positivos e corrigiu os reais)*

---

## Em andamento

*(Nenhum item em andamento)*

## Próximo
- [ ] **Refactor: firebase-retry.js withRetrySync nome contradiz comportamento async e export nao utilizado - remover ou renomear** `[P]` `[Backend]`
- [ ] **Layout: messages.css dark mode greeting-auto-badge background rgba(37,99,235,0.15) hardcoded em vez de var** `[P]` `[Layout]`
- [ ] **Layout: portOpener.css dark mode override .futura-search-widget e dead code (futura-widget.css carrega depois e vence)** `[P]` `[Layout]`
- [ ] **Layout: futura-widget.css regra .ai-block-header duplicada (linhas 453 e 1140) com overrides conflitantes - hazard de manutencao** `[P]` `[Layout]`
- [ ] **Refactor: futura-widget-modal saveConfig deriva provider por indice DOM (modeCards[0]/provCards[0]) em vez de data-mode/data-provider - fragil a reordem** `[M]` `[Backend]`
- [ ] **Refactor: futura-widget-config syncConfig e dead code duplicado de createConfig - remover** `[P]` `[Backend]`
- [ ] **Refactor: futura-widget reimplementa _escHtml/_escAttr em vez de importar escapeHtml/escapeAttr de utils.js - risco de drift** `[P]` `[Backend]`
- [ ] **Refactor: tab activation duplicada entre escPos.js e portOpener.js (_activateTab/_activateOutputTab com keydown) - escPos true toggle vs portOpener add redundante** `[P]` `[Backend]`
- [ ] **Refactor: badge status (pending/ok/error) duplicado em apiTester/statusChecker/fileValidator/docValidatorUI com nomes de classes divergentes - extrair setStatusBadge** `[P]` `[Backend]`
- [ ] **Refactor: search.js runSearch 139 linhas com 3 blocos quase identicos (messages/problems/links) - extrair builder por entidade** `[P]` `[Backend]`
- [ ] **Refactor: logica drag-and-drop triplicada em messages/problems/links (dragstart/dragover/dragend/addKeyboardDragSupport) - extrair helper compartilhado** `[M]` `[Backend]`
- [ ] **Refactor: padrao botao loading (disabled+spinner+finally) duplicado em auth/admin/messages com spinners diferentes - extrair withButtonLoading helper** `[P]` `[Backend]`
- [ ] **PWA: manifest.json icon emoji SVG data-URI sem variantes PNG 192/512 maskable - install splash piorado e sem suporte legacy** `[P]` `[Backend]`
- [ ] **PWA: index.html meta theme-color duplicada (linhas 9 e 16) e sem variant media=prefers-color-scheme:dark - chrome do browser fica azul em dark** `[P]` `[Backend]`
- [ ] **UX: history.js counter cor var(--warning,#f59e0b) com fallback hardcoded - dark mode sem --warning usa laranja fixo** `[P]` `[UI]`
- [ ] **UX: futura-widget.css .modal select option background:white hardcoded - dropdown quebra em dark mode** `[M]` `[Layout]`
- [ ] **UX: futura-widget.css height:800px overflow:hidden sem override responsivo - mobile landscape <800px clipa widget inteiro** `[M]` `[Layout]`
- [ ] **UX: messages loader.js greeting filter esconde Boa tarde/Boa noite fora do horario sem toggle - usuario manha nao consegue editar outras saudacoes** `[P]` `[UI]`
- [ ] **UX: enhancements applyGlobalSearch usa row.textContent com labels de botoes (Editar/Remover/aria-labels) - buscar 'editar' retorna todos itens** `[P]` `[UI]`
- [ ] **A11y: portOpener poTagPills sem role=list/aria-label - SR nao anuncia lista de portas selecionadas** `[P]` `[Accessibility]`
- [ ] **A11y: decisionTree options com numero visual (1..N) mas sem handler teclado - hint numerica sugere atalho que nao existe** `[P]` `[Accessibility]`
- [ ] **A11y: statusChecker cards de status sem aria-live=polite/role=status - auto-refresh 30s invisivel para SR** `[M]` `[Accessibility]`
- [ ] **A11y: networkDiag inputs ndHost/ndPort sem label/aria-label (placeholder only) - SR nao anuncia proposito nem range 1-65535** `[P]` `[Accessibility]`
- [ ] **A11y: futura-widget audioReadBtn troca Ouvir/Parar via innerHTML sem aria-pressed/aria-label atualizado - SR anuncia nome stale** `[P]` `[Accessibility]`
- [ ] **A11y: futura-widget modal label Chave da API sem for=fw-inp-apikey - label nao foca input e SR nao anuncia relacao** `[M]` `[Accessibility]`
- [ ] **A11y: futura-widget modal sem botao X de fechar - inconsistente com demais modais do app (modalOverlay, helpModal, etc)** `[M]` `[Accessibility]`
- [ ] **A11y: futura-widget statusPill e voiceSearchBtn/clearHistoryBtn sao icon-only sem aria-label (title inconsistentemente suportado por SR)** `[P]` `[Accessibility]`
- [ ] **A11y: futura-widget history items sao divs com onclick sem role=button/tabindex/keydown - teclado nao acessa historico** `[M]` `[Accessibility]`
- [ ] **A11y: futura-widget suggestions sem role=listbox/combobox, input sem aria-controls/aria-expanded - autocomplete invisivel para SR** `[M]` `[Accessibility]`
- [ ] **A11y: search.js resultados tem role=option mas container #globalSearchResults sem role=listbox - aria-activedescendant (shortcuts.js) nao funciona** `[M]` `[Accessibility]`
- [ ] **A11y: problems solution-editor contenteditable com role=textbox mas sem aria-label/aria-labelledby - multiplos editores indistingutiveis para SR** `[M]` `[Accessibility]`
- [ ] **A11y: help.js tabs sem role=tab/aria-selected/aria-controls e sem navegacao setas - inconsistente com tabs.js principal que tem ARIA correto** `[M]` `[Accessibility]`
- [ ] **Bug: decisionTree _renderStep if(!node) return silencioso - UI fica presa no passo anterior sem feedback usuario** `[P]` `[UI]`
- [ ] **Bug: admin.js paginacao Carregar mais aparece quando resultados sao multiplo exato de PAGE_SIZE - click carrega pagina vazia (off-by-one)** `[P]` `[UI]`
- [ ] **Bug: auth.js setInterval updateHeaderProfileGreeting roda a cada 30s mesmo em background/idle - desperdico bateria, nao pausa com document.hidden** `[P]` `[Bug]`
- [ ] **Bug: futura-widget duas implementacoes showToast competem pelo #toast (futura-widget-utils.js e js/toast.js) - toasts se sobrescrevem** `[M]` `[Bug]`
- [ ] **Bug: futura-widget theme toggle delega para #btnTheme global mas widget escopo local data-theme nao segue - clicar Tema Escuro muda app mas widget fica claro** `[M]` `[UI]`
- [ ] **Bug: futura-widget-modal.js overlay click handler registrado duas vezes (linhas 78 e 114) - cada abertura adiciona handler duplicado** `[P]` `[Bug]`
- [ ] **Bug: links.js delete/reorder usam currentUserId module-scoped sem null check - logout durante modal confirmatorio escreve em users/null/links** `[P]` `[Bug]`
- [ ] **Bug: messages loader.js ondragend chama saveOrder incondicionalmente - drag sem movimento gera batch write desnecessario** `[P]` `[Bug]`
- [ ] **Bug: messages saveOrder usa indice visivel i+1 mas allMessages contem greetings filtrados - reordenar em horario diferente embaralha order no Firestore** `[M]` `[Bug]`
- [ ] **Bug: statusChecker _renderGrid data-url e href nao escapados com escapeAttr - viola regra XSS defensiva (constants hardcoded hoje)** `[P]` `[Security]`
- [ ] **Bug: decisionTree injecta node.solution/question/answer/title via innerHTML sem escape - viola regra XSS (atualmente hardcoded TREES mas arquitetura fragil)** `[P]` `[Security]`
*(Nenhum item pendente)*

*(Nenhum item pendente)*

*(Nenhum item pendente)*



## Feito
- [x] **Bug: messages exportFormatModal click listener (messages.js:175) nunca removido em resetMessages - so keydown e limpo, click vaza entre login/logout** `[P]` `[Bug]`
- [x] **Bug: messages trash.js restore chama onReload e depois loadTrash+updateTrashCount - double reload dispara duas viagens Firestore e flicker** `[P]` `[Bug]`
- [x] **Bug: futura-widget-search.js performSearch sem AbortController/in-flight guard - Enter+click rapido dispara duas chamadas API ( desperdico de quota Gemini/OpenAI)** `[M]` `[Bug]`
- [x] **Bug: futura-widget-audio.js getVoices() sincrono retorna [] no Chrome/Edge - TTS usa voz en-US em vez de pt-BR, fala portugues com sotaque errado** `[M]` `[Bug]`
- [x] **Bug: futura-widget-audio.js SpeechRecognition re-init cria segunda instancia - voiceSearchBtn duplica recognition e dispara duas buscas por voz** `[M]` `[Bug]`
- [x] **Bug: futura-widget destroy() nao remove listeners (click/keydown em widgetScope, searchInput, botoes) - re-init no mesmo container vaza handlers** `[M]` `[Bug]`
- [x] **Bug: messages trash.js loadTrash sem limit() - getDocs carrega todas as mensagens deletadas (loadMessages usa limit 500 mas trash nao)** `[M]` `[Bug]`
- [x] **Bug: messages state.js resetState nao limpa dragSrc - drag em andamento na troca de usuario causa insertBefore em DOM detachado** `[P]` `[Bug]`
- [x] **Bug: links.js resetLinks nao limpa allLinks/dragSrcLink - allLinks.find em saveLinkOrder pode escrever order do usuario anterior** `[M]` `[Bug]`
- [x] **Bug: problems.js resetProblems nao limpa allProblems/dragSrcProblem/_lastProblemDoc - paginacao startAfter cursor do usuario anterior, vaza lista em memoria** `[M]` `[Bug]`
- [x] **Bug: messages.js btnAddMsg le maxOrder e addDoc com maxOrder+1 - dois cliques rapidos criam mensagens com order duplicado (race condition)** `[M]` `[Bug]`
- [x] **Bug: statusChecker fetch no-cors resolve em qualquer resposta HTTP (4xx/5xx) e marca SEFAZ como Online falsamente - falsifica diagnostico de suporte** `[M]` `[Bug]`
- [x] **Bug: networkDiag tenta HTTPS primeiro em portas 80/443 e falha CORS/cert - relata offline quando HTTP funciona - falso negativo** `[P]` `[Bug]`
- [x] **Bug: networkDiag testPort probe HTTP/HTTPS testa porta 80/443 mas reporta qualquer porta como online - diagnostico errado para portas 9100/3306/1433** `[M]` `[Bug]`
- [x] **Bug: portOpener generator.js poSummaryTags innerHTML nao escapa p.label - viola regra XSS do CLAUDE.md** `[G]` `[Security]`
- [x] **Bug: portOpener _generate muta seletores globais .po-otab/.po-pane e quebra tabs do ESC/POS ao gerar scripts - usar container scope** `[G]` `[Bug]`

*(Nenhum item concluído neste ciclo ainda)*

---

## Ideias (não priorizado)
- [ ] Gráfico com estatísticas das mensagens copiadas mais frequentemente `[M]` `[Estatísticas]`
- [ ] Envio de backups automáticos por email `[G]` `[Integração]`
