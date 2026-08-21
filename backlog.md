# Backlog

> 💡 **Dica de uso:** Você pode gerenciar este backlog via terminal com o script:
> * Adicionar tarefa: `node scripts/backlog.js add "Título da tarefa" --size M --scope UI`
> * Concluir tarefa: `node scripts/backlog.js done "Trecho do título"`
> * Nova release: `node scripts/backlog.js release v1.2.0`
> * **Gerar changelog e limpar backlog:** `node scripts/backlog.js changelog` (este comando extrai os itens concluídos, adiciona-os no topo do `CHANGELOG.md` e limpa a seção **Feito** automaticamente).
>
> **Tags padrão:** Tamanhos `[P]`, `[M]`, `[G]` | Escopos `[UI]`, `[Bug]`, `[Layout]`, `[Backend]`, `[Accessibility]`, `[QA]`, `[Arch]`, `[UX]`, `[DevOps]`


## 📍 Estado atual
Última sessão: 2ª análise aprofundada do código (aug/2026). Total de 23 itens identificados e registrados no backlog, cobrindo UX, Analytics, Ferramentas, Base de Conhecimento, Bugs e Qualidade Técnica.

---

## Em andamento

*(Nenhum item em andamento)*

## Próximo

### 🐛 Bugs & Críticos
- [ ] **Resetar `copyCount` diário via Cloud Function agendada (Firebase) ao invés do timer no cliente** — `resetDailyCounts()` em `ranking.js` depende de a aba estar aberta à meia-noite `[M]` `[Backend]`

### ⚙️ Qualidade Técnica
- [ ] **Proteção contra rate limiting no Firestore** — `loadMessages` e `loadProblems` sem throttle; usuários com muitos dados podem gerar leituras excessivas `[M]` `[Backend]`
- [ ] **Lazy-loading das ferramentas no portOpener** — todos os painéis são construídos no carregamento inicial; ferramentas pesadas como `decisionTree` (~30 KB) devem ser carregadas sob demanda `[G]` `[Arch]`
- [ ] **Adicionar contatos reais de suporte (WhatsApp/e-mail) no painel de Ajuda** `[P]` `[UX]`
- [ ] **Cloud Function para exclusão completa de usuário no Firebase Auth** — hoje a exclusão remove apenas o Firestore, não o Auth `[G]` `[Backend]`

### 🚀 UX / Produtividade
- [ ] **Melhorar modo Popout para janela compacta sempre no topo (`always-on-top`) ao lado do CRM/PDV** `[M]` `[UX]`
- [ ] **Ordenação automática das mensagens por mais copiadas (igual ao que foi feito nos links)** — ranking já existente, mas mensagens ainda são ordenadas manualmente `[M]` `[UX]`
- [ ] **Filtro de favoritos persistente no servidor (Firestore)** — hoje favoritos ficam só no `localStorage`, se o usuário trocar de máquina perde tudo `[M]` `[Backend]`
- [ ] **Histórico dos últimos scripts gerados no Port Opener** — cada sessão começa zerada; manter últimos 5 gerados `[M]` `[UX]`
- [ ] **Modo de apresentação/treinamento** — oculta dados sensíveis de clientes em capturas de tela `[M]` `[UX]`

### 📊 Analytics / Relatórios
- [ ] **Dashboard de métricas e produtividade com gráficos de uso por dia/semana e soluções mais utilizadas** `[G]` `[UI]`
- [ ] **Gráfico de evolução por período (semana/mês) no dashboard de analytics** — hoje só mostra snapshot do dia `[G]` `[UI]`
- [ ] **Exportação do relatório de analytics incluindo gráficos (SVG embutidos no PDF)** — relatório atual exporta só KPIs em texto `[M]` `[UI]`
- [ ] **KPI de tempo médio de atendimento estimado baseado em cópias por hora** `[M]` `[Backend]`
- [ ] **Contador de uso acumulado no tempo nas mensagens** — `copyCount` existe por sessão diária, mas não há acumulado histórico por mensagem `[M]` `[Backend]`
- [ ] **Envio de backups automáticos por email** `[G]` `[Integração]`

### 🤖 IA & Automação
- [ ] **Expandir IA Assistente com gerador de respostas empáticas e formatador automático de resumo de chamados** `[M]` `[Arch]`
- [ ] **Exportar/importar backup completo (mensagens, links, preferências) em arquivo `.json` criptografado** `[M]` `[Backend]`

### 📚 Base de Conhecimento
*(Nenhum item pendente)*


## Feito
- [x] **Busca inline em tempo real dentro da lista de mensagens (Ctrl+F dentro da aba ativa)** — `enhancements.js` já tem base, mas sem highlight dos resultados `[M]` `[UX]`
- [x] **Indicador visual de problemas sem solução cadastrada** — hoje não há diferenciação visual `[P]` `[UI]`
- [x] **Filtro por status da solução (Confirmada / Em teste / Obsoleta) na listagem de problemas** `[M]` `[UX]`
- [x] **Command Palette universal (`Ctrl+K`) para busca simultânea em mensagens, problemas, links e ferramentas** `[G]` `[UX]`
- [x] **Duplicar problema com todas as soluções** `[P]` `[UX]`
- [x] **Duplicar mensagem/problema com um clique** — evita recriar entradas similares do zero `[P]` `[UX]`
- [x] **`sw.js`: Corrigir caminhos de pre-cache legados** — erros 404 ao instalar PWA pela primeira vez `[G]` `[Bug]`

*(Nenhum item concluído neste ciclo ainda)*

---
