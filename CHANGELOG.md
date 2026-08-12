# Changelog

All notable changes to this project will be documented in this file.

## [v1.1.8] - 10/08/2026
* **UX: enhancements applyGlobalSearch usa row.textContent com labels de botoes (Editar/Remover/aria-labels) - buscar 'editar' retorna todos itens** `[P]` `[UI]`
* **UX: messages loader.js greeting filter esconde Boa tarde/Boa noite fora do horario sem toggle - usuario manha nao consegue editar outras saudacoes** `[P]` `[UI]`
* **UX: history.js counter cor var(--warning,#f59e0b) com fallback hardcoded - dark mode sem --warning usa laranja fixo** `[P]` `[UI]`
* **PWA: index.html meta theme-color duplicada (linhas 9 e 16) e sem variant media=prefers-color-scheme:dark - chrome do browser fica azul em dark** `[P]` `[Backend]`
* **PWA: manifest.json icon emoji SVG data-URI sem variantes PNG 192/512 maskable - install splash piorado e sem suporte legacy** `[P]` `[Backend]`
* **Refactor: padrao botao loading (disabled+spinner+finally) duplicado em auth/admin/messages com spinners diferentes - extrair withButtonLoading helper** `[P]` `[Backend]`
* **Refactor: logica drag-and-drop triplicada em messages/problems/links (dragstart/dragover/dragend/addKeyboardDragSupport) - extrair helper compartilhado** `[M]` `[Backend]`
* **Refactor: search.js runSearch 139 linhas com 3 blocos quase identicos (messages/problems/links) - extrair builder por entidade** `[P]` `[Backend]`
* **Refactor: badge status (pending/ok/error) duplicado em apiTester/statusChecker/fileValidator/docValidatorUI com nomes de classes divergentes - extrair setStatusBadge** `[P]` `[Backend]`
* **Refactor: tab activation duplicada entre escPos.js e portOpener.js (_activateTab/_activateOutputTab com keydown) - escPos true toggle vs portOpener add redundante** `[P]` `[Backend]`
* **Refactor: futura-widget reimplementa _escHtml/_escAttr em vez de importar escapeHtml/escapeAttr de utils.js - risco de drift** `[P]` `[Backend]`
* **Refactor: futura-widget-config syncConfig e dead code duplicado de createConfig - remover** `[P]` `[Backend]`
* **Layout: futura-widget.css regra .ai-block-header duplicada (linhas 453 e 1140) com overrides conflitantes - hazard de manutencao** `[P]` `[Layout]`
* **Layout: portOpener.css dark mode override .futura-search-widget e dead code (futura-widget.css carrega depois e vence)** `[P]` `[Layout]`
* **Layout: messages.css dark mode greeting-auto-badge background rgba(37,99,235,0.15) hardcoded em vez de var** `[P]` `[Layout]`
* **Refactor: firebase-retry.js withRetrySync nome contradiz comportamento async e export nao utilizado - remover ou renomear** `[P]` `[Backend]`
* **A11y: help.js tabs sem role=tab/aria-selected/aria-controls e sem navegacao setas - inconsistente com tabs.js principal que tem ARIA correto** `[M]` `[Accessibility]`
* **A11y: problems solution-editor contenteditable com role=textbox mas sem aria-label/aria-labelledby - multiplos editores indistingutiveis para SR** `[M]` `[Accessibility]`
* **A11y: futura-widget suggestions sem role=listbox/combobox, input sem aria-controls/aria-expanded - autocomplete invisivel para SR** `[M]` `[Accessibility]`
* **A11y: futura-widget history items sao divs com onclick sem role=button/tabindex/keydown - teclado nao acessa historico** `[M]` `[Accessibility]`
* **A11y: futura-widget statusPill e voiceSearchBtn/clearHistoryBtn sao icon-only sem aria-label (title inconsistentemente suportado por SR)** `[P]` `[Accessibility]`
* **A11y: futura-widget modal sem botao X de fechar - inconsistente com demais modais do app (modalOverlay, helpModal, etc)** `[M]` `[Accessibility]`
* **A11y: futura-widget modal label Chave da API sem for=fw-inp-apikey - label nao foca input e SR nao anuncia relacao** `[M]` `[Accessibility]`
* **A11y: futura-widget audioReadBtn troca Ouvir/Parar via innerHTML sem aria-pressed/aria-label atualizado - SR anuncia nome stale** `[P]` `[Accessibility]`
* **A11y: networkDiag inputs ndHost/ndPort sem label/aria-label (placeholder only) - SR nao anuncia proposito nem range 1-65535** `[P]` `[Accessibility]`
* **A11y: statusChecker cards de status sem aria-live=polite/role=status - auto-refresh 30s invisivel para SR** `[M]` `[Accessibility]`
* **A11y: decisionTree options com numero visual (1..N) mas sem handler teclado - hint numerica sugere atalho que nao existe** `[P]` `[Accessibility]`
* **A11y: portOpener poTagPills sem role=list/aria-label - SR nao anuncia lista de portas selecionadas** `[P]` `[Accessibility]`
* **A11y: search.js resultados tem role=option mas container #globalSearchResults sem role=listbox - aria-activedescendant (shortcuts.js) nao funciona** `[M]` `[Accessibility]`
* **Bug: messages saveOrder usa indice visivel i+1 mas allMessages contem greetings filtrados - reordenar em horario diferente embaralha order no Firestore** `[M]` `[Bug]`
* **Bug: messages loader.js ondragend chama saveOrder incondicionalmente - drag sem movimento gera batch write desnecessario** `[P]` `[Bug]`
* **Bug: links.js delete/reorder usam currentUserId module-scoped sem null check - logout durante modal confirmatorio escreve em users/null/links** `[P]` `[Bug]`
* **Bug: futura-widget-modal.js overlay click handler registrado duas vezes (linhas 78 e 114) - cada abertura adiciona handler duplicado** `[P]` `[Bug]`
* **Bug: admin.js paginacao Carregar mais aparece quando resultados sao multiplo exato de PAGE_SIZE - click carrega pagina vazia (off-by-one)** `[P]` `[UI]`
* **Bug: decisionTree _renderStep if(!node) return silencioso - UI fica presa no passo anterior sem feedback usuario** `[P]` `[UI]`
* **Bug: auth.js setInterval updateHeaderProfileGreeting roda a cada 30s mesmo em background/idle - desperdico bateria, nao pausa com document.hidden** `[P]` `[Bug]`
* **Bug: decisionTree injecta node.solution/question/answer/title via innerHTML sem escape - viola regra XSS (atualmente hardcoded TREES mas arquitetura fragil)** `[P]` `[Security]`
* **Bug: statusChecker _renderGrid data-url e href nao escapados com escapeAttr - viola regra XSS defensiva (constants hardcoded hoje)** `[P]` `[Security]`
* **Refactor: futura-widget-modal saveConfig deriva provider por indice DOM (modeCards[0]/provCards[0]) em vez de data-mode/data-provider - fragil a reordem** `[M]` `[Backend]`
* **UX: futura-widget.css height:800px overflow:hidden sem override responsivo - mobile landscape <800px clipa widget inteiro** `[M]` `[Layout]`
* **UX: futura-widget.css .modal select option background:white hardcoded - dropdown quebra em dark mode** `[M]` `[Layout]`
* **Bug: futura-widget duas implementacoes showToast competem pelo #toast (futura-widget-utils.js e js/toast.js) - toasts se sobrescrevem** `[M]` `[Bug]`
* **Bug: futura-widget theme toggle delega para #btnTheme global mas widget escopo local data-theme nao segue - clicar Tema Escuro muda app mas widget fica claro** `[M]` `[UI]`
* **Bug: messages exportFormatModal click listener (messages.js:175) nunca removido em resetMessages - so keydown e limpo, click vaza entre login/logout** `[P]` `[Bug]`
* **Bug: messages trash.js restore chama onReload e depois loadTrash+updateTrashCount - double reload dispara duas viagens Firestore e flicker** `[P]` `[Bug]`
* **Bug: futura-widget-search.js performSearch sem AbortController/in-flight guard - Enter+click rapido dispara duas chamadas API ( desperdico de quota Gemini/OpenAI)** `[M]` `[Bug]`
* **Bug: futura-widget-audio.js getVoices() sincrono retorna [] no Chrome/Edge - TTS usa voz en-US em vez de pt-BR, fala portugues com sotaque errado** `[M]` `[Bug]`
* **Bug: futura-widget-audio.js SpeechRecognition re-init cria segunda instancia - voiceSearchBtn duplica recognition e dispara duas buscas por voz** `[M]` `[Bug]`
* **Bug: futura-widget destroy() nao remove listeners (click/keydown em widgetScope, searchInput, botoes) - re-init no mesmo container vaza handlers** `[M]` `[Bug]`
* **Bug: messages trash.js loadTrash sem limit() - getDocs carrega todas as mensagens deletadas (loadMessages usa limit 500 mas trash nao)** `[M]` `[Bug]`
* **Bug: messages state.js resetState nao limpa dragSrc - drag em andamento na troca de usuario causa insertBefore em DOM detachado** `[P]` `[Bug]`
* **Bug: links.js resetLinks nao limpa allLinks/dragSrcLink - allLinks.find em saveLinkOrder pode escrever order do usuario anterior** `[M]` `[Bug]`
* **Bug: problems.js resetProblems nao limpa allProblems/dragSrcProblem/_lastProblemDoc - paginacao startAfter cursor do usuario anterior, vaza lista em memoria** `[M]` `[Bug]`
* **Bug: messages.js btnAddMsg le maxOrder e addDoc com maxOrder+1 - dois cliques rapidos criam mensagens com order duplicado (race condition)** `[M]` `[Bug]`
* **Bug: statusChecker fetch no-cors resolve em qualquer resposta HTTP (4xx/5xx) e marca SEFAZ como Online falsamente - falsifica diagnostico de suporte** `[M]` `[Bug]`
* **Bug: networkDiag tenta HTTPS primeiro em portas 80/443 e falha CORS/cert - relata offline quando HTTP funciona - falso negativo** `[P]` `[Bug]`
* **Bug: networkDiag testPort probe HTTP/HTTPS testa porta 80/443 mas reporta qualquer porta como online - diagnostico errado para portas 9100/3306/1433** `[M]` `[Bug]`
* **Bug: portOpener generator.js poSummaryTags innerHTML nao escapa p.label - viola regra XSS do CLAUDE.md** `[G]` `[Security]`
* **Bug: portOpener _generate muta seletores globais .po-otab/.po-pane e quebra tabs do ESC/POS ao gerar scripts - usar container scope** `[G]` `[Bug]`

*(Nenhum item concluído neste ciclo ainda)*


## [v1.1.7] - 07/08/2026
* **Adicionar rate limiting/retry logic nas chamadas do Firebase — app fica fragil a erros de rede** `[M]` `[Backend]`
* **Criar script de backup automatico do Firestore — exportar dados periodicamente para JSON** `[M]` `[Backend]`
* **Adicionar testes para auth.js, messages.js, problems.js e links.js — aumentar cobertura de testes** `[M]` `[Backend]`
* **Implementar Prettier para formatacao automatica de codigo — padroniza aspas, indentacao e quebras de linha** `[M]` `[Backend]`
* **sw.js lista de assets hardcoded — nao inclui arquivos JS/CSS de ferramentas novas nem arquivos de tema** `[M]` `[Backend]`
* **index.html link do manifest.json faltando rel=manifest — necessario para instalacao PWA** `[P]` `[Backend]`
* **users.css .user-row.dragging background hardcoded #f8fafc — deveria usar variavel CSS** `[P]` `[Layout]`
* **users.css .user-row.blocked background-color hardcoded #fff5f5 — deveria usar variavel CSS** `[P]` `[Layout]`
* **Falta de linter e formatador (eslint + prettier) — sem padronizacao de qualidade de codigo** `[M]` `[Backend]`
* **Falta de testes automatizados (unitarios e integracao) — zero cobertura de testes** `[G]` `[Backend]`
* **Nenhum service worker ou PWA manifest — app nao funciona offline e nao e instalavel** `[M]` `[Backend]`
* **Nenhum CSP (Content Security Policy) — app vulneravel a XSS via CDN comprometido** `[M]` `[Security]`
* **Nenhum error boundary global — erro em um modulo pode quebrar toda a aplicacao sem feedback** `[M]` `[Bug]`
* **users.css .user-row background hardcoded #fff em vez de var(--card) — quebra dark mode e temas customizados** `[M]` `[Layout]`
* **Refatorar: messages.js 791 linhas misturando setup/render/import-export/lixeira - quebrar em modulos** `[G]` `[Backend]`
* **Bug: messages.js loadMessages/getDocs carrega TODAS as mensagens sem paginacao - degrada em bases grandes** `[M]` `[Backend]`
* **Bug: messages.js updateTrashCount carrega TODA a colecao messages so para contar deletados - usar aggregate query ou counter** `[M]` `[Backend]`
* **Bug: messages.js importFromTxt carrega TODA a colecao para dedup sem where/limite - pesado em bases grandes** `[M]` `[Backend]`
* **Bug: messages.js btnAddMsg carrega TODAS as mensagens via getDocs so para calcular maxOrder - usar orderBy+limit 1** `[M]` `[Backend]`
* **Bug: links.js loadLinks sem paginacao/limite - getDocs carrega todos os links do usuario** `[M]` `[Backend]`
* **Bug: admin.js deleteUser carrega TODAS as subcolecoes sem paginacao (messages/problems/links) - pode exceder memoria** `[M]` `[Backend]`
* **Refatorar: portOpener.js 635 linhas misturando HTML build/bind events/geracao de scripts - quebrar em modulos** `[M]` `[Backend]`
* **Refatorar: escPos.js 473 linhas com HTML/bind/geracao misturados - modularizar** `[M]` `[Backend]`
* **Refatorar: funcao _setCode + _hl (highlight de sintaxe) duplicada entre escPos.js e portOpener.js - extrair modulo compartilhado** `[P]` `[Backend]`
* **Refatorar: funcao segmented control (seg) duplicada em 6 arquivos (escPos, docValidatorUI, fileValidator, networkDiag, statusChecker, portOpener) - extrair helper compartilhado** `[P]` `[Backend]`
* **Bug: dark mode inconsistente em ferramentas novas - cores hardcoded (#eff6ff, #bfdbfe, #374151, etc) em apiTester, users, portOpener, decisionTree, docValidator, fileValidator, networkDiag, scriptGen, forms, history, links, tags, search CSS** `[G]` `[Layout]`
* **Bug: problems/problem-io.js saveProblemOrder reescreve todos os cards no batch sem verificar mudanca - otimizar diff** `[M]` `[Backend]`
* **Bug: links.js saveLinkOrder reescreve TODOS os links no batch mesmo os que nao mudaram - pesado em reordenacao grande** `[M]` `[Backend]`
* **Bug: escPos.js variaveis de estado globais (escPrinter, escText) nao resetadas ao reabrir aba - estado stale** `[P]` `[Bug]`
* **UX: login sem feedback de loading no botao Entrar/Entrar com Google durante autenticacao - usuario nao sabe se clicou** `[P]` `[UI]`
* **UX: botoes da toolbar (Importar/Novo problema/Novo link) sem title descritivo - inconsistente com botoes da aba Mensagens** `[P]` `[UI]`
* **A11y: animacoes (spinner, modalIn, fadeIn, poShake, poTagIn, ndSpin, scSpin) sem prefers-reduced-motion em 6 arquivos CSS** `[P]` `[Accessibility]`
* **A11y: .compact-favorites .btn-favorite com opacity:0 em estado normal - invisivel para navegacao por teclado** `[P]` `[Accessibility]`
* **A11y: futura-widget-template input de busca sem label ou aria-label - leitores nao anunciam proposito do campo** `[P]` `[Accessibility]`
* **A11y: help.js nao restaura foco ao fechar modal de ajuda - leitor perde contexto** `[P]` `[Accessibility]`
* **A11y: toast.js nao usa role=status ou aria-live - screen readers nao anunciam toast** `[P]` `[Accessibility]`
* **Bug: utils.js getTagColor armazena mapa de tags em localStorage global sem prefixo de usuario - vaza entre contas** `[P]` `[Bug]`
* **Bug: futura-widget searchCache cresce ate 100 entries mas nunca limpo no logout/troca de usuario - dados de sessao anterior vazam** `[M]` `[Bug]`
* **Bug: portOpener.js instancia FuturaSearchWidget sem userId (lsKey vazio) - localStorage do widget compartilhado entre contas no mesmo browser** `[M]` `[Bug]`
* **Bug: docValidatorUI.js injeta formatCPF/formatCNPJ via innerHTML sem escape (XSS em dados fiscais)** `[P]` `[Bug]`
* **Bug: apiTester.js historico de URLs exibido com innerHTML sem escape - XSS via URL maliciosa** `[M]` `[Bug]`
* **Bug: scriptGen.js _generate nao escapa valores das variaveis antes de inserir no template (XSS/injecao)** `[M]` `[Bug]`
* **Bug: escPos.js _hlEsc e portOpener.js _hl nao escapam > corretamente - geram HTML invalido em highlight de sintaxe** `[P]` `[Bug]`
* **Bug: history.js navigator.clipboard.writeText sem try/catch - rejeicao nao tratada deixa toast inconsistente** `[P]` `[Bug]`
* **Bug: enhancements.js Ctrl+F listener global registra a cada initEnhancements sem remocao no reset (vazamento em re-login)** `[M]` `[Bug]`
* **Bug: enhancements.js setupCounterListeners e setupFavorites acumulam listeners a cada init sem remocao no reset** `[M]` `[Bug]`
* **Bug: search.js initSearch registra input listener a cada chamada - acumulo se initSearch roda multiplas vezes** `[P]` `[Bug]`
* **Bug: messages.js exportFormatModal keydown listener registra novo handler a cada setupUserInterface (acumulo em re-login)** `[P]` `[Accessibility]`
* **Bug: auth.js headerTimeInterval e listener focus nao sao limpos se onAuthStateChanged dispara multiplas vezes (acumulo de timer/listeners)** `[M]` `[Bug]`
* **Nenhum pipeline de CI/CD (GitHub Actions) — sem lint, test e deploy automatico** `[M]` `[Backend]`
* **scripts/backlog.js nao possui testes — CLI core do projeto sem cobertura** `[P]` `[Backend]`

*(Nenhum item concluído neste ciclo ainda)*


## [v1.1.6] - 04/08/2026
* **Refatorar: futura-widget.js 2198 linhas como IIFE gigante com proxy document/window - quebrar em metodos de classe nomeados** `[G]` `[Backend]`
* **A11y: shortcuts.js buscard resultados nao seta aria-activedescendant/aria-selected ao navegar com setas - leitores nao anunciam item destacado** `[M]` `[Accessibility]`
* **Bug: theme.js initTheme apos DOMContentLoaded causa flash de tema errado (FOUC) - comment diz que previne mas o call e deferido** `[M]` `[UI]`
* **Bug: shortcuts.js _searchIndex desincroniza quando results re-renderizam async (debounce 200ms) - TypeError ao apertar seta durante re-render** `[P]` `[Bug]`
* **Bug: enhancements.js copyFirstResult chama navigator.clipboard.writeText sem await/catch - toast 'Copiado!' aparece mesmo quando falha** `[P]` `[Bug]`
* **Bug: modal.js callback async (confirm/cancel) sem try/catch - rejeicao nao tratada deixa modal preso e callback permanente** `[M]` `[Bug]`
* **Bug: links.js enterEditMode destroi star de favoritos/edit/del via innerHTML - se loadLinks falhar apos save, card trava em edit form** `[M]` `[Bug]`
* **Bug: links.js drag cross-group move DOM mas nao persiste category - usuario acha que re-categorizou mas volta ao recarregar (silencioso)** `[M]` `[Bug]`
* **Bug: futura-widget.js escapeQ() e no-op (cada replace troca char por ele mesmo) - nao escapa aspas/angle brackets em atributo data-query** `[P]` `[Bug]`
* **Bug: futura-widget.js renderResults injeta title/description/link da API Gemini sem escape (XSS em AI data)** `[M]` `[Bug]`
* **Bug: futura-widget.js showProviderChoice injeta query do usuario sem escape no prompt preview (XSS via voz/quick-tag)** `[M]` `[Bug]`
* **Bug: futura-widget.js loadDependencies() async nunca aguardado - search roda antes de marked/DOMPurify carregarem, cai em fallback vulneravel** `[M]` `[Bug]`
* **Bug: escPos.js regex de variável captura comentários Python (# comentário) como variável** `[P]` `[Bug]`
* **Bug: apiTester.js listener duplicado no btnSend - envia requisição 2x (duplicate event handler)** `[P]` `[Bug]`
* **Bug: fileValidator.js Destinatário lê CNPJ do emitente em vez do destino** `[P]` `[Bug]`
* **Refatorar: problems.js com 719 linhas misturando UI/render/tags/editor/dnd - quebrar em módulos** `[G]` `[Backend]`
* **Modal de alerta/confirmação não implementa focus trap completo (foco pode vazar para background)** `[M]` `[Accessibility]`
* **Contenteditable #problemSolution sem role=textbox e aria-multiline para leitores de tela** `[M]` `[Accessibility]`
* **Abas não suportam navegação por setas (ArrowLeft/Right) entre tabs, apenas click/Enter** `[M]` `[Accessibility]`
* **Backend: import de problemas não deduplica por título - gera lista com mesmos títulos** `[P]` `[Backend]`
* **Contador #trashCount e badges de aba sem aria-live para anunciar mudanças dinâmicas** `[P]` `[Accessibility]`
* **Refatorar: lógica de saudação por horário (Bom dia/tarde/noite) duplicada em messages.js renderMessages e isGreeting - extrair para utils.js** `[P]` `[Backend]`
* **Bug: FuturaSearchWidget mock addEventListener no IIFE chama document.removeEventListener() antes de addEventListener() - remove listeners legítimos** `[G]` `[Bug]`
* **Busca global (Ctrl+K) abre modal mas não foca automaticamente no input ao abrir** `[P]` `[UI]`
* **Botões sem type=button no HTML causam submissão acidental de formulários (default submit em <form>)** `[P]` `[Accessibility]`
* **A11y: tabs.js não implementa padrão ARIA completo - falta role=tablist/tab/tabpanel com aria-controls** `[M]` `[Accessibility]`
* **Refatorar: enhancements.js usa input.oninput/onkeydown (sobrescreve) em vez de addEventListener - listeners perdidos em multi-init** `[P]` `[Bug]`
* **UX: mensagens na lixeira sem botão de exclusão definitiva individual - só 'Esvaziar lixeira' deleta** `[P]` `[UI]`
* **Bug: rich-editor aceita qualquer imagem como dataURL base64 - 10MB vira string de 13MB no Firestore (doc max 1MB)** `[G]` `[Bug]`
* **UX: nenhum feedback de progresso durante emptyTrash em mensagens - usuário não sabe se processo está rodando** `[P]` `[UI]`
* **Backend: loadProblems sem paginação - getDocs de toda coleção degrada performance em bases grandes** `[M]` `[Backend]`
* **Bug: openSearch em shortcuts.js registra listener de input a cada abertura - vazamento de listeners (ainda pendente após refatoração anterior)** `[P]` `[Bug]`
* **Backend: saveOrder usa writeBatch mas reescreve TODAS as rows mesmo as que não mudaram - pesado em reordenação grande** `[P]` `[Backend]`
* **Cores hardcoded em problems.css/tags.css/compact-favorites.css/help.css em vez de variáveis CSS - dark mode inconsistente** `[M]` `[Layout]`
* **UX: import de arquivo grande não mostra progresso - batch em chunks de 500 sem feedback X de Y** `[M]` `[UI]`
* **Refatorar: exportToTxt e exportToJson quase idênticos - extrair helper exportAsFile(content, filename, mimeType)** `[P]` `[UI]`
* **Refatorar: search.js reimplementa escapeHtml em highlight() - utils.js já exporta escapeHtml - duplicação** `[P]` `[Backend]`
* **Race condition: loadMessages async pode ser disparado várias vezes (clique duplo em Editar/Salvar) gerando render inconsistente** `[M]` `[Bug]`
* **UX: emptyTrash deleta vários docs sem desabilitar botão nem spinner - usuário pode clicar várias vezes** `[P]` `[UI]`
* **Bug: seed inicial de saudações usa localStorage flag - se usuário limpar localStorage as saudações duplicam - usar query Firestore** `[P]` `[Bug]`
* **UX: btnCreateUser finally sempre define innerHTML='Criar usuário' mesmo se texto era outro - perde estado original** `[P]` `[UI]`
* **Admin não valida username/email únicos antes de criar usuário - pode haver duplicatas comprometendo login** `[M]` `[Bug]`
* **Bug: username lookup em doLogin usa snap.docs[0] sem validar unicidade - duplicatas permitem autenticar com email arbitrário** `[M]` `[Bug]`
* **A11y: enterEditMode foca em .edit-msg-text sem anunciar contexto (sem aria-label/aria-describedby) ao screen reader** `[P]` `[Accessibility]`
* **Bug: futura-widget.js loadDependencies() não aguarda onload de marked/DOMPurify - falha silenciosa em CDNs lentos** `[M]` `[Bug]`
* **Refatorar: enhancements.js usa compactMode no localStorage sem prefixo de usuário - vaza entre contas no mesmo browser** `[M]` `[Bug]`
* **Refatorar: FuturaSearchWidget injeta ~1300 linhas de CSS inline a cada instância sem cache - mover para arquivo .css compartilhado** `[M]` `[Backend]`
* **A11y: .modal-overlay sem role=dialog/aria-modal/aria-labelledby em modal.js - screen readers não reconhecem como diálogo** `[P]` `[Accessibility]`
* **Bug: searchCache Map em futura-widget.js cresce sem limite (memory leak) - sem LRU, max-size ou TTL** `[M]` `[Bug]`
* **UX: loading state ausente em enterEditMode/saveEdit de problems - nenhum feedback durante gravação** `[P]` `[UI]`
* **Layout: :hover sem :focus-visible em .tag-filter-chip, .solution-copy-field, .help-tab, .accordion-trigger - teclado sem feedback visual** `[P]` `[Layout]`
* **Backend: deleteDoc do admin não é atômico - Promise.all com deleteDoc individuais deixa estado parcial se uma falha** `[M]` `[Backend]`
* **Refatorar: futura-widget.js duplica showToast (existe em toast.js) e initTheme/toggleTheme (existe em theme.js) - usar módulos compartilhados** `[P]` `[Backend]`

*(Nenhum item concluído neste ciclo ainda)*


## [v1.1.5] - 31/07/2026
* **Gerador de Scripts & Comandos Dinâmicos: Gerador de comandos SQL (reset de caixa, liberação de terminal, correção de status de NFe/NFCe/Ponto) e comandos CMD/PowerShell com variáveis dinâmicas (ex: {ip_pdv}, {cnpj}, {porta_impressora})** `[G]` `[UI]`
* **Utilitário de Diagnóstico de Redes & Dispositivos PDV/Ponto: Calculadora IP/Subrede e testador de porta/comunicação (Port Opener/Socket check) para impressoras térmicas, balanças, leitores e relógios de ponto (REP)** `[M]` `[UI]`
* **Árvore de Decisão & Triagem Interativa: Guias passo a passo interativos para diagnosticar falhas comuns (ex: PDV não conecta no banco, Impressora não corta papel, Ponto não coleta marcação, E-commerce não sincroniza estoque)** `[G]` `[UI]`
* **Gerador de Sumário de Atendimento / Encerramento de Chamado: Formulário rápido para gerar resumo padronizado (Cliente, Sistema/Módulo, Causa Raiz, Solução Aplicada, Testes Feitos) para colar diretamente no sistema de Tickets/CRM** `[M]` `[UI]`
* **Validador e Utilitário de Arquivos Fiscais / Ponto: Validador rápido de XML de NFe/NFCe, parser de arquivos AFD/AFDT de relógio de ponto e extrator de CNPJ/Inscrição Estadual** `[M]` `[Backend]`
* **Central de Testes de APIs & Webhooks (E-commerce/Mobile): Testador rápido de endpoints REST/Webhooks para verificar integrações com plataformas como WooCommerce, VTEX, Mercado Livre e APIs Mobile** `[M]` `[UI]`
* **Checador de Status de SEFAZ e Gateways de Pagamento: Painel integrado exibindo o status de disponibilidade dos serviços da SEFAZ (NFe/NFCe por UF) e adquirentes (Stone, PagBank, Mercado Pago, TEF)** `[M]` `[UI]`
* **Validador e Calculador de Documentos / Chaves Fiscais: Gerador/Validador de CNPJ, CPF, PIS, Inscrição Estadual por UF e gerador de DV de Chave de Acesso de NFe/NFCe para testes de homologação** `[P]` `[UI]`
* **Gerador de Comandos de Impressão ESC/POS (Teste de Impressoras Térmicas): Ferramenta para gerar comandos brutos de corte de papel, gaveta e avanço de página em impressoras de cupom (Epson, Bematech, Elgin, Daruma)** `[M]` `[UI]`
* **Gerador de Comandos de Impressão ESC/POS (Teste de Impressoras Térmicas): Ferramenta para gerar comandos brutos de corte de papel, gaveta e avanço de página em impressoras de cupom (Epson, Bematech, Elgin, Daruma)** `[M]` `[UI]`
* **Refatorar: futura-widget.js e um monolito de 2198 linhas misturando CSS inline HTML injection e logica JS - quebrar em modulos ES6 (css, config, search, voice, audio)** `[G]` `[Backend]`
* **A11y: FuturaSearchWidget cria modal de config injetado em document.body sem role=dialog aria-modal focus trap e retorno de foco ao fechar** `[M]` `[Accessibility]`
* **Bug: components.css .modal-box usa background: white hardcoded - no tema escuro o modal de alerta fica fundo branco com texto claro legibilidade baixa (parcialmente corrigido so para dark mode)** `[P]` `[Bug]`
* **UX: login.css usa cores hardcoded (#f3f4f6, #0f172a, #64748b) em vez de variaveis CSS - tela de login nao responde ao tema escuro** `[M]` `[Layout]`
* **Bug: loadUsers em admin.js busca TODOS os usuarios do Firestore sem paginacao - se a base crescer pode estourar limites de leitura e degradar performance** `[M]` `[Backend]`
* **Bug: renderMessages em messages.js reconstroi todo o DOM via innerHTML a cada mudanca de filtro de categoria - perde foco atual estado de drag ativo e scroll position** `[M]` `[Bug]`
* **Bug: filterLinks em links.js chama renderLinks que re-renderiza todo o DOM apos cada keystroke - perde estado de drag handles favoritos e anexos de eventos** `[M]` `[Bug]`
* **Bug: localStorage do futura-widget.js (futura-history, futura-theme, futura-mode, futura-apikey) e global sem userId misturando dados e config entre contas no mesmo browser** `[M]` `[Bug]`
* **Bug: futura-widget.js registra document.addEventListener globais (click, keydown) que acumulam listeners se o widget for re-renderizado ou trocar de aba** `[M]` `[Bug]`
* **Bug: futura-widget.js usa IDs genéricos (searchInput, historyList, suggestions, loader) que colidem com IDs do app principal causando conflitos no DOM** `[M]` `[Bug]`
* **UX: limparHistorico em history.js (btnClearHistory) nao tem openConfirmModal - acao irreversivel de limpar todo o historico com um clique sem confirmacao** `[P]` `[UI]`
* **A11y: data-placeholder do rich-editor (contenteditable) nao e acessivel a leitores de tela - nao ha aria-label ou label associado ao editor de solucao** `[P]` `[Accessibility]`
* **Bug: highlight de sintaxe _hl em portOpener.js usa regex encadeadas que podem quebrar ao aplicar spans dentro de outros spans criando HTML malformado (ex: numeros dentro de strings/comentarios)** `[M]` `[Bug]`
* **UX: busca em problems.js (problemSearch) e links.js (linkSearch) nao tem debounce - dispara filtragem a cada keystroke causando re-render desnecessario** `[P]` `[UI]`
* **A11y: botoes de editar e excluir de links (link-edit-btn, link-del-btn) usam opacity:0 so aparecem no hover - inacessiveis em dispositivos touch e teclado** `[P]` `[Accessibility]`
* **UX: loadTrash nao tem loading state - ao abrir a lixeira mostra conteudo anterior ou vazio durante o carregamento Firebase sem spinner** `[P]` `[UI]`
* **UX: Botao de login com Google (btnGoogleLogin) nao tem estado de loading/disabled durante autenticacao - permite double-click e nao da feedback visual** `[P]` `[UI]`
* **A11y: po-quick-btn (botoes de portas rapidas) sem aria-pressed para indicar estado ativo/selecionado** `[P]` `[Accessibility]`
* **A11y: po-tag-remove (botao remover porta) sem aria-label descritivo - so tem o caractere x sem texto acessivel para leitores de tela** `[P]` `[Accessibility]`
* **A11y: Segmented controls do portOpener (po-seg-btn de protocolo e direcao) sem role=radiogroup/radio e aria-checked para indicar selecao** `[P]` `[Accessibility]`
* **A11y: Abas do portOpener (po-otab) sem role=tab, aria-selected e sem navegacao por teclado (setas) - leitores de tela nao reconhecem como tablist** `[M]` `[Accessibility]`
* **A11y: Modal de exportacao (exportFormatModal) nao fecha com tecla Escape nem tem role=dialog/aria-modal - inconsistente com outros modais** `[P]` `[Accessibility]`
* **A11y: futura-widget.js nao respeita prefers-reduced-motion - varias animacoes inline (slide, fadeUp, shimmer, pulseMic) ignoram a preferencia de reducao de movimento** `[P]` `[Accessibility]`
* **A11y: falta link skip-to-content e preferências prefers-reduced-motion nos estilos de animação** `[P]` `[Accessibility]`
* **A11y: chips de filtro de categoria/tags sem aria-pressed para indicar filtro ativo** `[P]` `[Accessibility]`
* **A11y: modal de busca global sem role=dialog, aria-modal e resultados sem navegação anunciada (listbox/option)** `[M]` `[Accessibility]`
* **A11y: modais (alerta, confirmação, export, logout) sem focus trap, retorno de foco e fechamento por Escape/overlay** `[M]` `[Accessibility]`
* **A11y: estrelas de favorito (enhancements.js) sem aria-label nem aria-pressed para estado favoritado** `[P]` `[Accessibility]`
* **A11y: botões só com ícone no header (tema, compacto, busca, ajuda, limpar busca) sem aria-label descritivo** `[P]` `[Accessibility]`
* **A11y: tabs.js não atualiza aria-selected nem tabindex ao trocar abas — leitores de tela não refletem a aba ativa** `[M]` `[Accessibility]`
* **UX: historico de copias (history.js) nao tem indicador de qual categoria o item pertencia visualmente - carrega cat no DOM mas sem distingue cores porCategoria** `[P]` `[UI]`
* **Bug: portOpener.js cria instancia new FuturaSearchWidget() no DOMContentLoaded antes de saber se o usuario esta logado - widget inicializa desnecessariamente para admins e tela de login** `[M]` `[Bug]`
* **Refatorar: normalizeSolutions duplicado em utils.js e problems.js com implementacoes divergentes - o de utils.js nao normaliza copyTexts e o de problems.js sim unificar** `[P]` `[Backend]`
* **Bug: escapeQ em futura-widget.js e incompleto nao escapa <, >, & permitindo XSS em data-query dos botoes de provider** `[M]` `[Bug]`
* **Bug: logout nao reseta modulo enhancements (filteringFavorites e estado compacto) permitindo vazamento de estado entre sessoes de usuarios diferentes** `[M]` `[Bug]`
* **Bug: copyFirstResult em enhancements.js copia o textContent cru da mensagem ignorando a substituicao do placeholder {usuario} - copia texto nao processado** `[P]` `[Bug]`
* **Bug: copyFirstResult em enhancements.js para links usa firstLink.querySelector('.link-main') e verifica link.href mas .link-main e uma tag <a> nem sempre tem href direto - pode falhar ao abrir link** `[P]` `[Bug]`
* **UX: busca global (Ctrl+K) não inclui Links Úteis — apenas mensagens e problemas** `[M]` `[UI]`
* **UX: formulários de login e criação de usuário sem estado de loading/disabled anti double-submit no admin** `[P]` `[UI]`
* **UX: painel de Ajuda/Suporte lista WhatsApp e e-mail sem contatos reais ou links acionáveis** `[P]` `[UI]`
* **UX: filtro horário de saudações esconde mensagens que apenas mencionam 'bom dia/tarde/noite' no texto, não só saudações** `[M]` `[UI]`
* **Backend: exclusão de usuário remove Firestore mas deixa conta no Firebase Auth — e-mail fica ocupado (Cloud Function)** `[G]` `[Backend]`
* **Layout: header com muitos botões quebra em telas médias — reorganizar em menu overflow ou agrupar ações secundárias** `[M]` `[Layout]`
* **Layout: estilos inline espalhados no HTML/JS (auth logout overlay, toolbars, export modal) — migrar para classes CSS reutilizáveis** `[M]` `[Layout]`
* **UX: problemas têm exportação JSON mas não há importação correspondente na UI** `[M]` `[UI]`
* **UX: exclusão de mensagem (soft-delete) sem confirmação — item some da lista sem feedback de confirmação** `[P]` `[UI]`
* **UX: botões Favoritos em Problemas/Links só com ícone sem texto — inconsistente com Mensagens e menos claro** `[P]` `[UI]`
* **Backend: importação de mensagens faz N writes sequenciais no Firestore — usar writeBatch em lotes de 500** `[M]` `[Backend]`
* **Backend: seed de saudações padrão recria 3 mensagens sempre que a coleção fica vazia (inclui após esvaziar tudo)** `[P]` `[Backend]`
* **Layout: regras CSS duplicadas de .hidden-by-search/.hidden-by-filter em base.css (linhas 60-62 e 165-166)** `[P]` `[Layout]`
* **Refatorar: modal de logout customizado em auth.js duplica confirmModal — reutilizar openConfirmModal** `[P]` `[UI]`
* **Refatorar: botão restaurar da lixeira e empty trash sem aria-label — ícones sem texto acessível** `[P]` `[Accessibility]`
* **UX: tema escuro/claro não anuncia estado no botão (aria-pressed ou texto dinâmico além do title)** `[P]` `[Accessibility]`
* **Bug: drag-and-drop de mensagens só reordena dentro do mesmo grupo de categoria — arrastar entre grupos não move o item no DOM** `[M]` `[Bug]`
* **UX: empty states de listas sem CTA (botão Nova mensagem/problema) para ação imediata** `[P]` `[UI]`
* **UX/Layout: Melhorar o feedback visual de estado vazio (Empty State) em mensagens, problemas e histórico para usar componentes de card padronizados** `[M]` `[Layout]`
* **A11y: inputs de busca (globalSearch, problemSearch, linkSearch) sem label associado visível ou aria-label** `[P]` `[Accessibility]`
* **Acessibilidade: Ausência de rótulos aria-label em campos de formulário e inputs de busca sem tag label explícita (Search e Filtros)** `[P]` `[Accessibility]`
* **UX: Ausência de indicação visual de foco (focus outline) personalizada e consistente em botões de ação e campos interativos no tema escuro** `[M]` `[UI]`
* **Refatoração: Duplicação de lógica de escape HTML e sanitização em múltiplos arquivos em vez de centralizar 100% no utils.js** `[M]` `[Backend]`
* **Bug: Em links.js, se a requisição Firebase falhar ao carregar links na inicialização, a lista fica sem mensagem explicativa de erro para o usuário** `[P]` `[Bug]`
* **A11y: solution-copy-field tem role=button e tabindex mas sem handler de teclado Enter/Espaço para copiar** `[P]` `[Accessibility]`
* **Acessibilidade: Ausência de atributos aria-expanded nos botões do accordion de soluções (js/problems.js)** `[P]` `[Accessibility]`
* **Refatorar: normalizeSolutions duplicado em problems.js e search.js — extrair para utils.js compartilhado** `[P]` `[Backend]`
* **Bug: histórico de cópias (history.js) usa chave global no localStorage sem userId — mistura histórico entre contas no mesmo browser** `[M]` `[Bug]`
* **Refatorar: escapeAttr incompleto — só escapa aspas, não &, <, > — unificar com escapeHtml para atributos** `[P]` `[Bug]`
* **Bug: copyFirstResult em enhancements.js usa style.display !== 'none' para detectar visibilidade, ignorando hidden-by-search e hidden-by-filter CSS classes — itens ocultos por classes podem ser copiados erroneamente** `[M]` `[Bug]`
* **Bug: exclusão de problemas e links é permanente sem openConfirmModal — risco de perda acidental de dados** `[M]` `[Bug]`
* **UX: limpar histórico de cópias sem confirmação — ação irreversível com um clique** `[P]` `[UI]`
* **Bug: logout não chama resetLinks nem limpa linkList — estado de links pode vazar entre sessões de usuários** `[M]` `[Bug]`
* **Bug: doLogin faz password.trim() e pode alterar senhas com espaços intencionais no início/fim** `[P]` `[Bug]`
* **Bug: atalhos 1-4 registrados em duplicata (shortcuts.js e enhancements.js) — podem disparar navegação de aba duas vezes** `[P]` `[Bug]`
* **Bug: openSearch em shortcuts.js registra listener de input a cada abertura do modal (once:false) — vazamento de listeners** `[P]` `[Bug]`
* **Bug: sanitizeHtml permite src javascript: ou data: perigosos em imagens — restringir a https e data:image/*** `[M]` `[Bug]`
* **Bug: XSS em search.js highlight() — texto de mensagens/problemas inserido em innerHTML sem escape antes de aplicar <mark>** `[M]` `[Bug]`
* **Bug: XSS em admin.js — username, email e photoURL renderizados via innerHTML sem escapeHtml/escapeAttr** `[M]` `[Bug]`
* **Bug: {usuario} em mensagens usa o texto completo do header (ex: 'Bom dia, joao!') em vez do username puro — copiar injeta saudação no nome** `[M]` `[Bug]`

*(Nenhum item concluído neste ciclo ainda)*


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
