# Backlog

> 💡 **Dica de uso:** Você pode gerenciar este backlog via terminal com o script:
> * Adicionar tarefa: `node scripts/backlog.js add "Título da tarefa" --size M --scope UI`
> * Concluir tarefa: `node scripts/backlog.js done "Trecho do título"`
> * Nova release: `node scripts/backlog.js release v1.2.0`
> * **Gerar changelog e limpar backlog:** `node scripts/backlog.js changelog` (este comando extrai os itens concluídos, adiciona-os no topo do `CHANGELOG.md` e limpa a seção **Feito** automaticamente).
>
> **Tags padrão:** Tamanhos `[P]`, `[M]`, `[G]` | Escopos `[UI]`, `[Bug]`, `[Layout]`, `[Backend]`, `[Accessibility]`


## 📍 Estado atual
Última sessão: Refatorado o monolito `futura-widget.js` (2312 linhas) em 9 módulos ES6 — `futura-widget.js` agora tem 275 linhas como orquestrador fino, CSS movido para `css/futura-widget.css` (linkado no index.html), IIFE gigante e `document` proxy removidos, lógica distribuída em módulos nomeados (template, config, utils, theme, search, render, modal, audio). Total de 30 itens concluídos neste ciclo.
Próximo passo: Backlog vazio — novo ciclo de auditoria pode identificar novos itens.

## ⚠️ Decisões pendentes
- Contatos reais de suporte (WhatsApp/e-mail) no painel de Ajuda.
- Escopo da Cloud Function para exclusão completa de usuário no Firebase Auth.

## 🐛 Bugs conhecidos
*(Nenhum bug conhecido no momento — auditoria recente confirmou falsos positivos e corrigiu os reais)*

---

## Em andamento

*(Nenhum item em andamento)*

## Próximo
- [ ] **Bug: escPos.js _hlEsc e portOpener.js _hl nao escapam > corretamente - geram HTML invalido em highlight de sintaxe** `[P]` `[Bug]`
- [ ] **Bug: problems/problem-io.js saveProblemOrder reescreve todos os cards no batch sem verificar mudanca - otimizar diff** `[M]` `[Backend]`
- [ ] **Bug: links.js saveLinkOrder reescreve TODOS os links no batch mesmo os que nao mudaram - pesado em reordenacao grande** `[M]` `[Backend]`
- [ ] **A11y: .compact-favorites .btn-favorite com opacity:0 em estado normal - invisivel para navegacao por teclado** `[P]` `[Accessibility]`
- [ ] **A11y: animacoes (spinner, modalIn, fadeIn, poShake, poTagIn, ndSpin, scSpin) sem prefers-reduced-motion em 6 arquivos CSS** `[P]` `[Accessibility]`
- [ ] **A11y: futura-widget-template input de busca sem label ou aria-label - leitores nao anunciam proposito do campo** `[P]` `[Accessibility]`
- [ ] **A11y: help.js nao restaura foco ao fechar modal de ajuda - leitor perde contexto** `[P]` `[Accessibility]`
- [ ] **A11y: toast.js nao usa role=status ou aria-live - screen readers nao anunciam toast** `[P]` `[Accessibility]`
- [ ] **Refatorar: funcao segmented control (seg) duplicada em 6 arquivos (escPos, docValidatorUI, fileValidator, networkDiag, statusChecker, portOpener) - extrair helper compartilhado** `[P]` `[Backend]`
- [ ] **Refatorar: funcao _setCode + _hl (highlight de sintaxe) duplicada entre escPos.js e portOpener.js - extrair modulo compartilhado** `[P]` `[Backend]`
- [ ] **Refatorar: escPos.js 473 linhas com HTML/bind/geracao misturados - modularizar** `[M]` `[Backend]`
- [ ] **Refatorar: portOpener.js 635 linhas misturando HTML build/bind events/geracao de scripts - quebrar em modulos** `[M]` `[Backend]`
- [ ] **Refatorar: messages.js 791 linhas misturando setup/render/import-export/lixeira - quebrar em modulos** `[G]` `[Backend]`
- [ ] **Bug: escPos.js variaveis de estado globais (escPrinter, escText) nao resetadas ao reabrir aba - estado stale** `[P]` `[Bug]`
- [ ] **Bug: utils.js getTagColor armazena mapa de tags em localStorage global sem prefixo de usuario - vaza entre contas** `[P]` `[Bug]`
- [ ] **Bug: portOpener.js instancia FuturaSearchWidget sem userId (lsKey vazio) - localStorage do widget compartilhado entre contas no mesmo browser** `[M]` `[Bug]`
- [ ] **Bug: futura-widget searchCache cresce ate 100 entries mas nunca limpo no logout/troca de usuario - dados de sessao anterior vazam** `[M]` `[Bug]`
- [ ] **Bug: search.js initSearch registra input listener a cada chamada - acumulo se initSearch roda multiplas vezes** `[P]` `[Bug]`
- [ ] **Bug: messages.js exportFormatModal keydown listener registra novo handler a cada setupUserInterface (acumulo em re-login)** `[P]` `[Accessibility]`
- [ ] **Bug: enhancements.js setupCounterListeners e setupFavorites acumulam listeners a cada init sem remocao no reset** `[M]` `[Bug]`
- [ ] **Bug: auth.js headerTimeInterval e listener focus nao sao limpos se onAuthStateChanged dispara multiplas vezes (acumulo de timer/listeners)** `[M]` `[Bug]`
- [ ] **Bug: enhancements.js Ctrl+F listener global registra a cada initEnhancements sem remocao no reset (vazamento em re-login)** `[M]` `[Bug]`
- [ ] **Bug: auth.js onAuthStateChanged nao desabilita botoes durante loading - clique duplo chama doLogin/doGoogleLogin (race condition)** `[M]` `[Bug]`
- [ ] **Bug: history.js navigator.clipboard.writeText sem try/catch - rejeicao nao tratada deixa toast inconsistente** `[P]` `[Bug]`
- [ ] **Bug: docValidatorUI.js injeta formatCPF/formatCNPJ via innerHTML sem escape (XSS em dados fiscais)** `[P]` `[Bug]`
- [ ] **Bug: apiTester.js historico de URLs exibido com innerHTML sem escape - XSS via URL maliciosa** `[M]` `[Bug]`
- [ ] **Bug: scriptGen.js _generate nao escapa valores das variaveis antes de inserir no template (XSS/injecao)** `[M]` `[Bug]`
- [ ] **Bug: admin.js deleteUser carrega TODAS as subcolecoes sem paginacao (messages/problems/links) - pode exceder memoria** `[M]` `[Backend]`
- [ ] **Bug: links.js loadLinks sem paginacao/limite - getDocs carrega todos os links do usuario** `[M]` `[Backend]`
- [ ] **Bug: messages.js btnAddMsg carrega TODAS as mensagens via getDocs so para calcular maxOrder - usar orderBy+limit 1** `[M]` `[Backend]`
- [ ] **Bug: messages.js btnAddMsg carrega TODAS as mensagens via getDocs so para calcular maxOrder - usar orderBy+limit 1** `[M]` `[Backend]`
- [ ] **Bug: messages.js importFromTxt carrega TODA a colecao para dedup sem where/limite - pesado em bases grandes** `[M]` `[Backend]`
- [ ] **Bug: messages.js updateTrashCount carrega TODA a colecao messages so para contar deletados - usar aggregate query ou counter** `[M]` `[Backend]`
- [ ] **Bug: messages.js loadMessages/getDocs carrega TODAS as mensagens sem paginacao - degrada em bases grandes** `[M]` `[Backend]`
*(Nenhum item pendente)*



## Feito

*(Nenhum item concluído neste ciclo ainda)*

---

## Ideias (não priorizado)
- [ ] Gráfico com estatísticas das mensagens copiadas mais frequentemente `[M]` `[Estatísticas]`
- [ ] Envio de backups automáticos por email `[G]` `[Integração]`
