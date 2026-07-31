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
*(Nenhum item pendente)*



## Feito

*(Nenhum item concluído neste ciclo ainda)*

---

## Ideias (não priorizado)
- [ ] Gráfico com estatísticas das mensagens copiadas mais frequentemente `[M]` `[Estatísticas]`
- [ ] Envio de backups automáticos por email `[G]` `[Integração]`
