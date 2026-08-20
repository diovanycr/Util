# Backlog

> 💡 **Dica de uso:** Você pode gerenciar este backlog via terminal com o script:
> * Adicionar tarefa: `node scripts/backlog.js add "Título da tarefa" --size M --scope UI`
> * Concluir tarefa: `node scripts/backlog.js done "Trecho do título"`
> * Nova release: `node scripts/backlog.js release v1.2.0`
> * **Gerar changelog e limpar backlog:** `node scripts/backlog.js changelog` (este comando extrai os itens concluídos, adiciona-os no topo do `CHANGELOG.md` e limpa a seção **Feito** automaticamente).
>
> **Tags padrão:** Tamanhos `[P]`, `[M]`, `[G]` | Escopos `[UI]`, `[Bug]`, `[Layout]`, `[Backend]`, `[Accessibility]`, `[QA]`, `[Arch]`, `[UX]`, `[DevOps]`


## 📍 Estado atual
Última sessão: Auditoria completa do sistema realizada pelos agentes do Framework AIOX (QA, Architect, UX/Design, DevOps). Identificados 15 novos itens priorizados de melhoria: correção crítica do PWA ServiceWorker (`sw.js`), isolamento de estado multi-tenant, sanitização de atributos, lazy-loading de ferramentas em `portOpener.js`, acessibilidade WCAG/Focus Trap em modais, responsividade mobile da sidebar de departamentos e pipeline de CI/CD.

## ⚠️ Decisões pendentes
- Contatos reais de suporte (WhatsApp/e-mail) no painel de Ajuda.
- Escopo da Cloud Function para exclusão completa de usuário no Firebase Auth.

## 🐛 Bugs conhecidos
- `sw.js`: Pre-cache com caminhos legados (`./js/firebase.js`, etc.) gerando erro 404 durante a instalação do ServiceWorker em instalações novas PWA.

---

## Em andamento

*(Nenhum item em andamento)*

## Próximo

*(Nenhum item pendente)*


## Feito

*(Nenhum item concluído neste ciclo ainda)*

---

## Ideias (não priorizado)
- [ ] Gráfico com estatísticas das mensagens copiadas mais frequentemente `[M]` `[Estatísticas]`
- [ ] Envio de backups automáticos por email `[G]` `[Integração]`
