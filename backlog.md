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
- XSS em admin.js e search.js (escape incompleto).
- Placeholder `{usuario}` injeta saudação do header.
- `sanitizeHtml` aceita `src` inseguro em imagens.

---

## Em andamento

*(Nenhum item em andamento)*

## Próximo
- [ ] **Refatorar: futura-widget.js e um monolito de 2198 linhas misturando CSS inline HTML injection e logica JS - quebrar em modulos ES6 (css, config, search, voice, audio)** `[G]` `[Backend]`
- [ ] **Gerador de Comandos de Impressão ESC/POS (Teste de Impressoras Térmicas): Ferramenta para gerar comandos brutos de corte de papel, gaveta e avanço de página em impressoras de cupom (Epson, Bematech, Elgin, Daruma)** `[M]` `[UI]`
- [ ] **Validador e Calculador de Documentos / Chaves Fiscais: Gerador/Validador de CNPJ, CPF, PIS, Inscrição Estadual por UF e gerador de DV de Chave de Acesso de NFe/NFCe para testes de homologação** `[P]` `[UI]`
- [ ] **Checador de Status de SEFAZ e Gateways de Pagamento: Painel integrado exibindo o status de disponibilidade dos serviços da SEFAZ (NFe/NFCe por UF) e adquirentes (Stone, PagBank, Mercado Pago, TEF)** `[M]` `[UI]`
- [ ] **Central de Testes de APIs & Webhooks (E-commerce/Mobile): Testador rápido de endpoints REST/Webhooks para verificar integrações com plataformas como WooCommerce, VTEX, Mercado Livre e APIs Mobile** `[M]` `[UI]`
- [ ] **Validador e Utilitário de Arquivos Fiscais / Ponto: Validador rápido de XML de NFe/NFCe, parser de arquivos AFD/AFDT de relógio de ponto e extrator de CNPJ/Inscrição Estadual** `[M]` `[Backend]`
- [ ] **Gerador de Sumário de Atendimento / Encerramento de Chamado: Formulário rápido para gerar resumo padronizado (Cliente, Sistema/Módulo, Causa Raiz, Solução Aplicada, Testes Feitos) para colar diretamente no sistema de Tickets/CRM** `[M]` `[UI]`
- [ ] **Árvore de Decisão & Triagem Interativa: Guias passo a passo interativos para diagnosticar falhas comuns (ex: PDV não conecta no banco, Impressora não corta papel, Ponto não coleta marcação, E-commerce não sincroniza estoque)** `[G]` `[UI]`
- [ ] **Utilitário de Diagnóstico de Redes & Dispositivos PDV/Ponto: Calculadora IP/Subrede e testador de porta/comunicação (Port Opener/Socket check) para impressoras térmicas, balanças, leitores e relógios de ponto (REP)** `[M]` `[UI]`
- [ ] **Gerador de Scripts & Comandos Dinâmicos: Gerador de comandos SQL (reset de caixa, liberação de terminal, correção de status de NFe/NFCe/Ponto) e comandos CMD/PowerShell com variáveis dinâmicas (ex: {ip_pdv}, {cnpj}, {porta_impressora})** `[G]` `[UI]`



## Feito
- [x] **A11y: FuturaSearchWidget cria modal de config injetado em document.body sem role=dialog aria-modal focus trap e retorno de foco ao fechar** `[M]` `[Accessibility]`
- [x] **Bug: components.css .modal-box usa background: white hardcoded - no tema escuro o modal de alerta fica fundo branco com texto claro legibilidade baixa (parcialmente corrigido so para dark mode)** `[P]` `[Bug]`
- [x] **UX: login.css usa cores hardcoded (#f3f4f6, #0f172a, #64748b) em vez de variaveis CSS - tela de login nao responde ao tema escuro** `[M]` `[Layout]`
- [x] **Bug: loadUsers em admin.js busca TODOS os usuarios do Firestore sem paginacao - se a base crescer pode estourar limites de leitura e degradar performance** `[M]` `[Backend]`
- [x] **Bug: renderMessages em messages.js reconstroi todo o DOM via innerHTML a cada mudanca de filtro de categoria - perde foco atual estado de drag ativo e scroll position** `[M]` `[Bug]`
- [x] **Bug: filterLinks em links.js chama renderLinks que re-renderiza todo o DOM apos cada keystroke - perde estado de drag handles favoritos e anexos de eventos** `[M]` `[Bug]`
- [x] **Bug: localStorage do futura-widget.js (futura-history, futura-theme, futura-mode, futura-apikey) e global sem userId misturando dados e config entre contas no mesmo browser** `[M]` `[Bug]`
- [x] **Bug: futura-widget.js registra document.addEventListener globais (click, keydown) que acumulam listeners se o widget for re-renderizado ou trocar de aba** `[M]` `[Bug]`
- [x] **Bug: futura-widget.js usa IDs genéricos (searchInput, historyList, suggestions, loader) que colidem com IDs do app principal causando conflitos no DOM** `[M]` `[Bug]`
- [x] **UX: limparHistorico em history.js (btnClearHistory) nao tem openConfirmModal - acao irreversivel de limpar todo o historico com um clique sem confirmacao** `[P]` `[UI]`
- [x] **A11y: data-placeholder do rich-editor (contenteditable) nao e acessivel a leitores de tela - nao ha aria-label ou label associado ao editor de solucao** `[P]` `[Accessibility]`
- [x] **Bug: highlight de sintaxe _hl em portOpener.js usa regex encadeadas que podem quebrar ao aplicar spans dentro de outros spans criando HTML malformado (ex: numeros dentro de strings/comentarios)** `[M]` `[Bug]`
- [x] **UX: busca em problems.js (problemSearch) e links.js (linkSearch) nao tem debounce - dispara filtragem a cada keystroke causando re-render desnecessario** `[P]` `[UI]`
- [x] **A11y: botoes de editar e excluir de links (link-edit-btn, link-del-btn) usam opacity:0 so aparecem no hover - inacessiveis em dispositivos touch e teclado** `[P]` `[Accessibility]`
- [x] **UX: loadTrash nao tem loading state - ao abrir a lixeira mostra conteudo anterior ou vazio durante o carregamento Firebase sem spinner** `[P]` `[UI]`
- [x] **UX: Botao de login com Google (btnGoogleLogin) nao tem estado de loading/disabled durante autenticacao - permite double-click e nao da feedback visual** `[P]` `[UI]`
- [x] **A11y: po-quick-btn (botoes de portas rapidas) sem aria-pressed para indicar estado ativo/selecionado** `[P]` `[Accessibility]`
- [x] **A11y: po-tag-remove (botao remover porta) sem aria-label descritivo - so tem o caractere x sem texto acessivel para leitores de tela** `[P]` `[Accessibility]`
- [x] **A11y: Segmented controls do portOpener (po-seg-btn de protocolo e direcao) sem role=radiogroup/radio e aria-checked para indicar selecao** `[P]` `[Accessibility]`
- [x] **A11y: Abas do portOpener (po-otab) sem role=tab, aria-selected e sem navegacao por teclado (setas) - leitores de tela nao reconhecem como tablist** `[M]` `[Accessibility]`
- [x] **A11y: Modal de exportacao (exportFormatModal) nao fecha com tecla Escape nem tem role=dialog/aria-modal - inconsistente com outros modais** `[P]` `[Accessibility]`
- [x] **A11y: futura-widget.js nao respeita prefers-reduced-motion - varias animacoes inline (slide, fadeUp, shimmer, pulseMic) ignoram a preferencia de reducao de movimento** `[P]` `[Accessibility]`
- [x] **A11y: falta link skip-to-content e preferências prefers-reduced-motion nos estilos de animação** `[P]` `[Accessibility]`
- [x] **A11y: chips de filtro de categoria/tags sem aria-pressed para indicar filtro ativo** `[P]` `[Accessibility]`
- [x] **A11y: modal de busca global sem role=dialog, aria-modal e resultados sem navegação anunciada (listbox/option)** `[M]` `[Accessibility]`
- [x] **A11y: modais (alerta, confirmação, export, logout) sem focus trap, retorno de foco e fechamento por Escape/overlay** `[M]` `[Accessibility]`
- [x] **A11y: estrelas de favorito (enhancements.js) sem aria-label nem aria-pressed para estado favoritado** `[P]` `[Accessibility]`
- [x] **A11y: botões só com ícone no header (tema, compacto, busca, ajuda, limpar busca) sem aria-label descritivo** `[P]` `[Accessibility]`
- [x] **A11y: tabs.js não atualiza aria-selected nem tabindex ao trocar abas — leitores de tela não refletem a aba ativa** `[M]` `[Accessibility]`
- [x] **UX: historico de copias (history.js) nao tem indicador de qual categoria o item pertencia visualmente - carrega cat no DOM mas sem distingue cores porCategoria** `[P]` `[UI]`
- [x] **Bug: portOpener.js cria instancia new FuturaSearchWidget() no DOMContentLoaded antes de saber se o usuario esta logado - widget inicializa desnecessariamente para admins e tela de login** `[M]` `[Bug]`
- [x] **Refatorar: normalizeSolutions duplicado em utils.js e problems.js com implementacoes divergentes - o de utils.js nao normaliza copyTexts e o de problems.js sim unificar** `[P]` `[Backend]`
- [x] **Bug: escapeQ em futura-widget.js e incompleto nao escapa <, >, & permitindo XSS em data-query dos botoes de provider** `[M]` `[Bug]`
- [x] **Bug: logout nao reseta modulo enhancements (filteringFavorites e estado compacto) permitindo vazamento de estado entre sessoes de usuarios diferentes** `[M]` `[Bug]`
- [x] **Bug: copyFirstResult em enhancements.js copia o textContent cru da mensagem ignorando a substituicao do placeholder {usuario} - copia texto nao processado** `[P]` `[Bug]`
- [x] **Bug: copyFirstResult em enhancements.js para links usa firstLink.querySelector('.link-main') e verifica link.href mas .link-main e uma tag <a> nem sempre tem href direto - pode falhar ao abrir link** `[P]` `[Bug]`
- [x] **UX: busca global (Ctrl+K) não inclui Links Úteis — apenas mensagens e problemas** `[M]` `[UI]`
- [x] **UX: formulários de login e criação de usuário sem estado de loading/disabled anti double-submit no admin** `[P]` `[UI]`
- [x] **UX: painel de Ajuda/Suporte lista WhatsApp e e-mail sem contatos reais ou links acionáveis** `[P]` `[UI]`
- [x] **UX: filtro horário de saudações esconde mensagens que apenas mencionam 'bom dia/tarde/noite' no texto, não só saudações** `[M]` `[UI]`
- [x] **Backend: exclusão de usuário remove Firestore mas deixa conta no Firebase Auth — e-mail fica ocupado (Cloud Function)** `[G]` `[Backend]`
- [x] **Layout: header com muitos botões quebra em telas médias — reorganizar em menu overflow ou agrupar ações secundárias** `[M]` `[Layout]`
- [x] **Layout: estilos inline espalhados no HTML/JS (auth logout overlay, toolbars, export modal) — migrar para classes CSS reutilizáveis** `[M]` `[Layout]`
- [x] **UX: problemas têm exportação JSON mas não há importação correspondente na UI** `[M]` `[UI]`
- [x] **UX: exclusão de mensagem (soft-delete) sem confirmação — item some da lista sem feedback de confirmação** `[P]` `[UI]`
- [x] **UX: botões Favoritos em Problemas/Links só com ícone sem texto — inconsistente com Mensagens e menos claro** `[P]` `[UI]`
- [x] **Backend: importação de mensagens faz N writes sequenciais no Firestore — usar writeBatch em lotes de 500** `[M]` `[Backend]`
- [x] **Backend: seed de saudações padrão recria 3 mensagens sempre que a coleção fica vazia (inclui após esvaziar tudo)** `[P]` `[Backend]`
- [x] **Layout: regras CSS duplicadas de .hidden-by-search/.hidden-by-filter em base.css (linhas 60-62 e 165-166)** `[P]` `[Layout]`
- [x] **Refatorar: modal de logout customizado em auth.js duplica confirmModal — reutilizar openConfirmModal** `[P]` `[UI]`
- [x] **Refatorar: botão restaurar da lixeira e empty trash sem aria-label — ícones sem texto acessível** `[P]` `[Accessibility]`
- [x] **UX: tema escuro/claro não anuncia estado no botão (aria-pressed ou texto dinâmico além do title)** `[P]` `[Accessibility]`
- [x] **Bug: drag-and-drop de mensagens só reordena dentro do mesmo grupo de categoria — arrastar entre grupos não move o item no DOM** `[M]` `[Bug]`
- [x] **UX: empty states de listas sem CTA (botão Nova mensagem/problema) para ação imediata** `[P]` `[UI]`
- [x] **UX/Layout: Melhorar o feedback visual de estado vazio (Empty State) em mensagens, problemas e histórico para usar componentes de card padronizados** `[M]` `[Layout]`
- [x] **A11y: inputs de busca (globalSearch, problemSearch, linkSearch) sem label associado visível ou aria-label** `[P]` `[Accessibility]`
- [x] **Acessibilidade: Ausência de rótulos aria-label em campos de formulário e inputs de busca sem tag label explícita (Search e Filtros)** `[P]` `[Accessibility]`
- [x] **UX: Ausência de indicação visual de foco (focus outline) personalizada e consistente em botões de ação e campos interativos no tema escuro** `[M]` `[UI]`
- [x] **Refatoração: Duplicação de lógica de escape HTML e sanitização em múltiplos arquivos em vez de centralizar 100% no utils.js** `[M]` `[Backend]`
- [x] **Bug: Em links.js, se a requisição Firebase falhar ao carregar links na inicialização, a lista fica sem mensagem explicativa de erro para o usuário** `[P]` `[Bug]`
- [x] **A11y: solution-copy-field tem role=button e tabindex mas sem handler de teclado Enter/Espaço para copiar** `[P]` `[Accessibility]`
- [x] **Acessibilidade: Ausência de atributos aria-expanded nos botões do accordion de soluções (js/problems.js)** `[P]` `[Accessibility]`
- [x] **Refatorar: normalizeSolutions duplicado em problems.js e search.js — extrair para utils.js compartilhado** `[P]` `[Backend]`
- [x] **Bug: histórico de cópias (history.js) usa chave global no localStorage sem userId — mistura histórico entre contas no mesmo browser** `[M]` `[Bug]`
- [x] **Refatorar: escapeAttr incompleto — só escapa aspas, não &, <, > — unificar com escapeHtml para atributos** `[P]` `[Bug]`
- [x] **Bug: copyFirstResult em enhancements.js usa style.display !== 'none' para detectar visibilidade, ignorando hidden-by-search e hidden-by-filter CSS classes — itens ocultos por classes podem ser copiados erroneamente** `[M]` `[Bug]`
- [x] **Bug: exclusão de problemas e links é permanente sem openConfirmModal — risco de perda acidental de dados** `[M]` `[Bug]`
- [x] **UX: limpar histórico de cópias sem confirmação — ação irreversível com um clique** `[P]` `[UI]`
- [x] **Bug: logout não chama resetLinks nem limpa linkList — estado de links pode vazar entre sessões de usuários** `[M]` `[Bug]`
- [x] **Bug: doLogin faz password.trim() e pode alterar senhas com espaços intencionais no início/fim** `[P]` `[Bug]`
- [x] **Bug: atalhos 1-4 registrados em duplicata (shortcuts.js e enhancements.js) — podem disparar navegação de aba duas vezes** `[P]` `[Bug]`
- [x] **Bug: openSearch em shortcuts.js registra listener de input a cada abertura do modal (once:false) — vazamento de listeners** `[P]` `[Bug]`
- [x] **Bug: sanitizeHtml permite src javascript: ou data: perigosos em imagens — restringir a https e data:image/*** `[M]` `[Bug]`
- [x] **Bug: XSS em search.js highlight() — texto de mensagens/problemas inserido em innerHTML sem escape antes de aplicar <mark>** `[M]` `[Bug]`
- [x] **Bug: XSS em admin.js — username, email e photoURL renderizados via innerHTML sem escapeHtml/escapeAttr** `[M]` `[Bug]`
- [x] **Bug: {usuario} em mensagens usa o texto completo do header (ex: 'Bom dia, joao!') em vez do username puro — copiar injeta saudação no nome** `[M]` `[Bug]`

*(Nenhum item concluído neste ciclo ainda)*

---

## Ideias (não priorizado)
- [ ] Gráfico com estatísticas das mensagens copiadas mais frequentemente `[M]` `[Estatísticas]`
- [ ] Envio de backups automáticos por email `[G]` `[Integração]`
