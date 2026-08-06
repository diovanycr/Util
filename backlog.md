# Backlog

> 💡 **Dica de uso:** Você pode gerenciar este backlog via terminal com o script:
> * Adicionar tarefa: `node scripts/backlog.js add "Título da tarefa" --size M --scope UI`
> * Concluir tarefa: `node scripts/backlog.js done "Trecho do título"`
> * Nova release: `node scripts/backlog.js release v1.2.0`
> * **Gerar changelog e limpar backlog:** `node scripts/backlog.js changelog` (este comando extrai os itens concluídos, adiciona-os no topo do `CHANGELOG.md` e limpa a seção **Feito** automaticamente).
>
> **Tags padrão:** Tamanhos `[P]`, `[M]`, `[G]` | Escopos `[UI]`, `[Bug]`, `[Layout]`, `[Backend]`, `[Accessibility]`


## 📍 Estado atual
Última sessão: Verificação item por item do backlog marcado como feito. 7 itens foram corrigidos e adicionados ao backlog: createHighlighter escape bug (G), enhancements.js listener leaks (M), search.js listener leak (M), messages/state.js uiInitialized reset bug (P), messages.js exportFormatModal listener leak (P). Backlog com 7 itens pendentes para próxima implementação.

## ⚠️ Decisões pendentes
- Contatos reais de suporte (WhatsApp/e-mail) no painel de Ajuda.
- Escopo da Cloud Function para exclusão completa de usuário no Firebase Auth.

## 🐛 Bugs conhecidos
*(Nenhum bug conhecido no momento — auditoria recente confirmou falsos positivos e corrigiu os reais)*

---

## Em andamento

*(Nenhum item em andamento)*

## Próximo
*(Nenhum item pendente)*

*(Nenhum item pendente)*

*(Nenhum item pendente)*



## Feito
- [x] **Adicionar rate limiting/retry logic nas chamadas do Firebase — app fica fragil a erros de rede** `[M]` `[Backend]`
- [x] **Criar script de backup automatico do Firestore — exportar dados periodicamente para JSON** `[M]` `[Backend]`
- [x] **Adicionar testes para auth.js, messages.js, problems.js e links.js — aumentar cobertura de testes** `[M]` `[Backend]`
- [x] **Implementar Prettier para formatacao automatica de codigo — padroniza aspas, indentacao e quebras de linha** `[M]` `[Backend]`
- [x] **sw.js lista de assets hardcoded — nao inclui arquivos JS/CSS de ferramentas novas nem arquivos de tema** `[M]` `[Backend]`
- [x] **index.html link do manifest.json faltando rel=manifest — necessario para instalacao PWA** `[P]` `[Backend]`
- [x] **users.css .user-row.dragging background hardcoded #f8fafc — deveria usar variavel CSS** `[P]` `[Layout]`
- [x] **users.css .user-row.blocked background-color hardcoded #fff5f5 — deveria usar variavel CSS** `[P]` `[Layout]`
- [x] **Falta de linter e formatador (eslint + prettier) — sem padronizacao de qualidade de codigo** `[M]` `[Backend]`
- [x] **Falta de testes automatizados (unitarios e integracao) — zero cobertura de testes** `[G]` `[Backend]`
- [x] **Nenhum service worker ou PWA manifest — app nao funciona offline e nao e instalavel** `[M]` `[Backend]`
- [x] **Nenhum CSP (Content Security Policy) — app vulneravel a XSS via CDN comprometido** `[M]` `[Security]`
- [x] **Nenhum error boundary global — erro em um modulo pode quebrar toda a aplicacao sem feedback** `[M]` `[Bug]`
- [x] **users.css .user-row background hardcoded #fff em vez de var(--card) — quebra dark mode e temas customizados** `[M]` `[Layout]`
- [x] **Refatorar: messages.js 791 linhas misturando setup/render/import-export/lixeira - quebrar em modulos** `[G]` `[Backend]`
- [x] **Bug: messages.js loadMessages/getDocs carrega TODAS as mensagens sem paginacao - degrada em bases grandes** `[M]` `[Backend]`
- [x] **Bug: messages.js updateTrashCount carrega TODA a colecao messages so para contar deletados - usar aggregate query ou counter** `[M]` `[Backend]`
- [x] **Bug: messages.js importFromTxt carrega TODA a colecao para dedup sem where/limite - pesado em bases grandes** `[M]` `[Backend]`
- [x] **Bug: messages.js btnAddMsg carrega TODAS as mensagens via getDocs so para calcular maxOrder - usar orderBy+limit 1** `[M]` `[Backend]`
- [x] **Bug: links.js loadLinks sem paginacao/limite - getDocs carrega todos os links do usuario** `[M]` `[Backend]`
- [x] **Bug: admin.js deleteUser carrega TODAS as subcolecoes sem paginacao (messages/problems/links) - pode exceder memoria** `[M]` `[Backend]`
- [x] **Refatorar: portOpener.js 635 linhas misturando HTML build/bind events/geracao de scripts - quebrar em modulos** `[M]` `[Backend]`
- [x] **Refatorar: escPos.js 473 linhas com HTML/bind/geracao misturados - modularizar** `[M]` `[Backend]`
- [x] **Refatorar: funcao _setCode + _hl (highlight de sintaxe) duplicada entre escPos.js e portOpener.js - extrair modulo compartilhado** `[P]` `[Backend]`
- [x] **Refatorar: funcao segmented control (seg) duplicada em 6 arquivos (escPos, docValidatorUI, fileValidator, networkDiag, statusChecker, portOpener) - extrair helper compartilhado** `[P]` `[Backend]`
- [x] **Bug: dark mode inconsistente em ferramentas novas - cores hardcoded (#eff6ff, #bfdbfe, #374151, etc) em apiTester, users, portOpener, decisionTree, docValidator, fileValidator, networkDiag, scriptGen, forms, history, links, tags, search CSS** `[G]` `[Layout]`
- [x] **Bug: problems/problem-io.js saveProblemOrder reescreve todos os cards no batch sem verificar mudanca - otimizar diff** `[M]` `[Backend]`
- [x] **Bug: links.js saveLinkOrder reescreve TODOS os links no batch mesmo os que nao mudaram - pesado em reordenacao grande** `[M]` `[Backend]`
- [x] **Bug: escPos.js variaveis de estado globais (escPrinter, escText) nao resetadas ao reabrir aba - estado stale** `[P]` `[Bug]`
- [x] **UX: login sem feedback de loading no botao Entrar/Entrar com Google durante autenticacao - usuario nao sabe se clicou** `[P]` `[UI]`
- [x] **UX: botoes da toolbar (Importar/Novo problema/Novo link) sem title descritivo - inconsistente com botoes da aba Mensagens** `[P]` `[UI]`
- [x] **A11y: animacoes (spinner, modalIn, fadeIn, poShake, poTagIn, ndSpin, scSpin) sem prefers-reduced-motion em 6 arquivos CSS** `[P]` `[Accessibility]`
- [x] **A11y: .compact-favorites .btn-favorite com opacity:0 em estado normal - invisivel para navegacao por teclado** `[P]` `[Accessibility]`
- [x] **A11y: futura-widget-template input de busca sem label ou aria-label - leitores nao anunciam proposito do campo** `[P]` `[Accessibility]`
- [x] **A11y: help.js nao restaura foco ao fechar modal de ajuda - leitor perde contexto** `[P]` `[Accessibility]`
- [x] **A11y: toast.js nao usa role=status ou aria-live - screen readers nao anunciam toast** `[P]` `[Accessibility]`
- [x] **Bug: utils.js getTagColor armazena mapa de tags em localStorage global sem prefixo de usuario - vaza entre contas** `[P]` `[Bug]`
- [x] **Bug: futura-widget searchCache cresce ate 100 entries mas nunca limpo no logout/troca de usuario - dados de sessao anterior vazam** `[M]` `[Bug]`
- [x] **Bug: portOpener.js instancia FuturaSearchWidget sem userId (lsKey vazio) - localStorage do widget compartilhado entre contas no mesmo browser** `[M]` `[Bug]`
- [x] **Bug: docValidatorUI.js injeta formatCPF/formatCNPJ via innerHTML sem escape (XSS em dados fiscais)** `[P]` `[Bug]`
- [x] **Bug: apiTester.js historico de URLs exibido com innerHTML sem escape - XSS via URL maliciosa** `[M]` `[Bug]`
- [x] **Bug: scriptGen.js _generate nao escapa valores das variaveis antes de inserir no template (XSS/injecao)** `[M]` `[Bug]`
- [x] **Bug: escPos.js _hlEsc e portOpener.js _hl nao escapam > corretamente - geram HTML invalido em highlight de sintaxe** `[P]` `[Bug]`
- [x] **Bug: history.js navigator.clipboard.writeText sem try/catch - rejeicao nao tratada deixa toast inconsistente** `[P]` `[Bug]`
- [x] **Bug: enhancements.js Ctrl+F listener global registra a cada initEnhancements sem remocao no reset (vazamento em re-login)** `[M]` `[Bug]`
- [x] **Bug: enhancements.js setupCounterListeners e setupFavorites acumulam listeners a cada init sem remocao no reset** `[M]` `[Bug]`
- [x] **Bug: search.js initSearch registra input listener a cada chamada - acumulo se initSearch roda multiplas vezes** `[P]` `[Bug]`
- [x] **Bug: messages.js exportFormatModal keydown listener registra novo handler a cada setupUserInterface (acumulo em re-login)** `[P]` `[Accessibility]`
- [x] **Bug: auth.js headerTimeInterval e listener focus nao sao limpos se onAuthStateChanged dispara multiplas vezes (acumulo de timer/listeners)** `[M]` `[Bug]`
- [x] **Nenhum pipeline de CI/CD (GitHub Actions) — sem lint, test e deploy automatico** `[M]` `[Backend]`
- [x] **scripts/backlog.js nao possui testes — CLI core do projeto sem cobertura** `[P]` `[Backend]`

*(Nenhum item concluído neste ciclo ainda)*

---

## Ideias (não priorizado)
- [ ] Gráfico com estatísticas das mensagens copiadas mais frequentemente `[M]` `[Estatísticas]`
- [ ] Envio de backups automáticos por email `[G]` `[Integração]`
