# Backlog

> 💡 **Dica de uso:** Você pode gerenciar este backlog via terminal com o script:
> * Adicionar tarefa: `node scripts/backlog.js add "Título da tarefa" --size M --scope UI`
> * Concluir tarefa: `node scripts/backlog.js done "Trecho do título"`
> * Nova release: `node scripts/backlog.js release v1.2.0`
> * **Gerar changelog e limpar backlog:** `node scripts/backlog.js changelog` (este comando extrai os itens concluídos, adiciona-os no topo do `CHANGELOG.md` e limpa a seção **Feito** automaticamente).
>
> **Tags padrão:** Tamanhos `[P]`, `[M]`, `[G]` | Escopos `[UI]`, `[Bug]`, `[Layout]`, `[Backend]`, `[Accessibility]`


## 📍 Estado atual
Última sessão: Finalizei 100% das tarefas de Críticas, Bugs, Importantes e Polimento do PainelAtende.
Próximo passo: Homologação e deploys finais.

## ⚠️ Decisões pendentes
- Nenhuma decisão crítica pendente no momento.

## 🐛 Bugs conhecidos
- Nenhum bug pendente nesta release.

---

## Em andamento

*(Tudo concluído nesta sprint!)*

## Próximo
- [ ] **Refactor: isolar o FuturaSearchWidget em um Web Component / Shadow DOM ou escopar CSS para evitar poluição global de estilos (futura-widget.js:58-81)** `[G]` `[Backend]`
- [ ] **UX: formulário de edição inline de mensagens e links não suporta atalho Ctrl+Enter para salvar (messages.js:414, links.js:239)** `[P]` `[UI]`
- [ ] **A11y: atalhos numéricos '1-4' e letras 'N', 'P' não são anunciados via aria-keyshortcuts nos botões de navegação/ação correspondentes (enhancements.js, shortcuts.js)** `[P]` `[Accessibility]`
- [ ] **A11y: drag and drop de mensagens, problemas e links é exclusivo para mouse — sem suporte para acionamento via teclado (Space/Enter/Setas) (messages.js, problems.js, links.js)** `[G]` `[Accessibility]`
- [ ] **Bug: FuturaSearchWidget possui botão #clearHistory com mesmo ID da history.js, podendo gerar colisões de listeners no DOM (futura-widget.js:1300, history.js)** `[P]` `[Bug]`
- [ ] **Bug: FuturaSearchWidget cria duplo alternador de tema (#themeToggleBtn) que não sincroniza com o initTheme() global do PainelAtende (futura-widget.js:1306, theme.js)** `[M]` `[Bug]`
- [ ] **Bug: FuturaSearchWidget em futura-widget.js reinjeta FontAwesome v6.5.2 e Google Fonts no <head> mesmo já existindo no index.html (futura-widget.js:18-45)** `[P]` `[Bug]`
- [ ] **Layout: painel de histórico de cópias não tem limitação de largura e causa estolamento em telas ultra-wide (history.js:57)** `[P]` `[Layout]`
- [ ] **Layout: modal de busca global (Ctrl+K) em telas pequenas (mobile/smartphones) ultrapassa altura e esconde caixa de input (search.css:16-24)** `[M]` `[Layout]`
- [ ] **Refactor: portOpener.js concatena strings HTML complexas via template literal de 200+ linhas sem componente dinâmico ou sanitização estrita (portOpener.js:31-197)** `[M]` `[Backend]`
- [ ] **Refactor: duplicar lógica de sanitizeHtml() / escapeHtml() entre utils.js e problemas.js — centralizar funções utilitárias (problems.js:671, utils.js)** `[P]` `[Backend]`
- [ ] **UX: botão de exportar mensagens exibe modal mas não indica claramente qual o formato default recomendado via teclado/foco (messages.js:95-134)** `[P]` `[UI]`
- [ ] **UX: formulário de novo link (index.html:283-285) não usa label+for nos campos URL, título e categoria — visualmente nu, sem orientação ao usuário** `[P]` `[UI]`
- [ ] **UX: não há feedback de loading/disabled no botão de login durante a autenticação — usuário pode clicar múltiplas vezes (auth.js:135)** `[M]` `[UI]`
- [ ] **A11y: favicons de links externos carregados via Google S2 sem fallback acessível — onerror só oculta, sem alt text descritivo (links.js:158)** `[P]` `[Accessibility]`
- [ ] **A11y: tabs principais (#userArea .tabs) não usam role=tablist/tab/tabpanel — estrutura semântica incorreta para tecnologias assistivas (index.html:130)** `[M]` `[Accessibility]`
- [ ] **A11y: label 'Solução' (index.html:234) não tem atributo for — editor contenteditable #problemSolution não pode ser associado com label convencional, precisa de aria-labelledby** `[P]` `[Accessibility]`
- [ ] **A11y: campo de tags em problema não possui label associado via for/id — label 'Tags' desassociado do input#problemTagInput (index.html:228)** `[P]` `[Accessibility]`
- [ ] **A11y: modal de busca global não prende foco (focus trap) — Tab navega para elementos da página de fundo (shortcuts.js, search.js)** `[M]` `[Accessibility]`
- [ ] **A11y: accordion-trigger nos problemas não possui aria-expanded nem aria-controls — estado aberto/fechado invisível para AT (problems.js:436)** `[M]` `[Accessibility]`
- [ ] **A11y: .msg-content clicável usa div, não botão — invia Tab-navigation e não é acionável via Enter pelo teclado (messages.js:343)** `[M]` `[Accessibility]`
- [ ] **A11y: botões de ação nos cards de mensagem (editar, excluir, favoritar) não possuem aria-label — ilegíveis por screen readers (messages.js:347-348)** `[M]` `[Accessibility]`
- [ ] **Bug: filtro de favoritos usa display:none/'' inline mas a busca global verifica style.display para visibilidade — conflito quando ambos estão ativos (enhancements.js)** `[M]` `[Bug]`
- [ ] **Bug: busca global (Ctrl+K) faz fetch ao Firestore a cada digitação sem cache local — N leituras por sessão e sem debounce suficiente (search.js:50-53)** `[M]` `[Bug]`
- [ ] **Bug: modal de alerta (#modalOverlay) possui botão OK sem id — quebra se houver múltiplas instâncias e é selecionado por querySelector frágil (modal.js:62)** `[P]` `[Bug]`
- [ ] **Bug: setupAutoTimeRefresh() em messages.js adiciona listener window 'focus' sem remover no resetMessages — mesmo problema de leak da auth.js** `[P]` `[Bug]`
- [ ] **Bug: import dinâmico de messages.js e problems.js no onAuthStateChanged sem necessidade — módulos já foram importados estaticamente (auth.js:97,106)** `[P]` `[Bug]`
- [ ] **Bug: listener 'focus' em window nunca é removido no logout — event listeners duplicados entre sessões (auth.js:279)** `[P]` `[Bug]`
- [ ] **Bug: headerTimeInterval nunca é limpo no logout — múltiplos intervalos acumulam entre sessões (auth.js:278)** `[P]` `[Bug]`
- [ ] **Bug: console.log de debug em renderMessages() vaza para produção (messages.js:244)** `[P]` `[Bug]`
*(Nenhum item pendente)*


## Feito

*(Nenhum item concluído neste ciclo ainda)*

---

## Ideias (não priorizado)
- [ ] Gráfico com estatísticas das mensagens copiadas mais frequentemente `[M]` `[Estatísticas]`
- [ ] Envio de backups automáticos por email `[G]` `[Integração]`
