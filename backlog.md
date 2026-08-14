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
- [ ] **Reorganizar arquivos de js em subpastas semânticas (core, tools, modules)** `[M]` `[Backend]`
*(Nenhum item pendente)*

*(Nenhum item pendente)*

*(Nenhum item pendente)*



## Feito
- [x] **Assistente de IA para gerar e reescrever respostas prontas** `[G]` `[UI]`
- [x] **Dashboard de métricas e analytics de atendimento com gráficos** `[G]` `[UI]`
- [x] **Sistema de pastas e categorias coloridas por departamento (Financeiro, N1, N2)** `[M]` `[UI]`
- [x] **Migrar runner do npm test para node --test nativo** `[P]` `[Backend]`
- [x] **Adicionar indicador visual de loading em operações assíncronas do Firestore** `[P]` `[UI]`
- [x] **Exportador de manual em PDF/HTML da Base de Conhecimento para treinamento** `[M]` `[UI]`
- [x] **Command Palette de busca ultra-rápida (Ctrl+K) com atalhos de cópia sem mouse** `[M]` `[UI]`
- [x] **Modo mini-painel em janela flutuante (Pop-out Window) para uso ao lado do WhatsApp** `[P]` `[Layout]`
- [x] **Adicionar botão de selecionar/desmarcar todos na importação de mensagens duplicadas** `[P]` `[UI]`
- [x] **Adicionar atributos de acessibilidade (ARIA, role=dialog, aria-label) nos modais e botões** `[P]` `[Accessibility]`
- [x] **Centralizar importações CSS em css/main.css** `[P]` `[Layout]`
- [x] **Auditoria AIOX: Validação de segurança XSS e suíte de testes ES Module 100% aprovada** `[P]` `[Quality]`

*(Nenhum item concluído neste ciclo ainda)*

---

## Ideias (não priorizado)
- [ ] Gráfico com estatísticas das mensagens copiadas mais frequentemente `[M]` `[Estatísticas]`
- [ ] Envio de backups automáticos por email `[G]` `[Integração]`
