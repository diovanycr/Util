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
*(Nenhum item pendente)*

*(Nenhum item pendente)*

*(Nenhum item pendente)*



## Feito

*(Nenhum item concluído neste ciclo ainda)*

---

## Ideias (não priorizado)
- [ ] Gráfico com estatísticas das mensagens copiadas mais frequentemente `[M]` `[Estatísticas]`
- [ ] Envio de backups automáticos por email `[G]` `[Integração]`
