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
- [ ] **A11y: drag and drop de mensagens, problemas e links é exclusivo para mouse — sem suporte para acionamento via teclado (Space/Enter/Setas) (messages.js, problems.js, links.js)** `[G]` `[Accessibility]`
- [ ] **Refactor: portOpener.js concatena strings HTML complexas via template literal de 200+ linhas sem componente dinâmico ou sanitização estrita (portOpener.js:31-197)** `[M]` `[Backend]`
*(Nenhum item pendente)*


## Feito

*(Nenhum item concluído neste ciclo ainda)*

---

## Ideias (não priorizado)
- [ ] Gráfico com estatísticas das mensagens copiadas mais frequentemente `[M]` `[Estatísticas]`
- [ ] Envio de backups automáticos por email `[G]` `[Integração]`
