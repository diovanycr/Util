# Backlog

> 💡 **Dica de uso:** Você pode gerenciar este backlog via terminal com o script:
> * Adicionar tarefa: `node scripts/backlog.js add "Título da tarefa" --size M --scope UI`
> * Concluir tarefa: `node scripts/backlog.js done "Trecho do título"`
> * Nova release: `node scripts/backlog.js release v1.2.0`
> * **Gerar changelog e limpar backlog:** `node scripts/backlog.js changelog` (este comando extrai os itens concluídos, adiciona-os no topo do `CHANGELOG.md` e limpa a seção **Feito** automaticamente).
>
> **Tags padrão:** Tamanhos `[P]`, `[M]`, `[G]` | Escopos `[UI]`, `[Bug]`, `[Layout]`, `[Backend]`, `[Accessibility]`, `[QA]`, `[Arch]`, `[UX]`, `[DevOps]`


## 📍 Estado atual
Última sessão: revisão multidisciplinar AIOX (Arquitetura, QA e UX) em aug/2026. Recomendações registradas cobrindo segurança, escala, qualidade, acessibilidade e produtividade.

---

## Em andamento

*(Nenhum item em andamento)*

## Próximo

### 🐛 Bugs & Críticos
*(Nenhum item pendente)*

### ⚙️ Qualidade Técnica
*(Nenhum item pendente)*

### 🚀 UX / Produtividade
- [ ] **Adaptar o cabeçalho para telas estreitas e zoom de 200%** — agrupar ações secundárias em “Mais” e validar a 320 px `[M]` `[UX]`
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
- [x] **Padronizar exclusão recuperável** — aplicar soft-delete e toast “Desfazer” a mensagens, links e problemas `[M]` `[UX]`
- [x] **Atualizar o cache do PWA com segurança** — manifesto gerado automaticamente por `scripts/generate-sw-manifest.js`, versionado por content hash; SW aguarda confirmação do usuário (toast "Atualizar agora") antes de ativar `[G]` `[Arch]`
- [x] **Cloud Function para exclusão completa de usuário no Firebase Auth** — `adminDeleteUser` callable com verificação de role server-side remove Auth + todas as subcoleções Firestore `[G]` `[Backend]`
- [x] **Lazy-loading das ferramentas no portOpener** — todos os painéis são construídos no carregamento inicial; ferramentas pesadas como `decisionTree` (~30 KB) devem ser carregadas sob demanda `[G]` `[Arch]`
- [x] **Paginar e agregar leituras do Firestore** — evitar carregamentos integrais/limites fixos em analytics, mensagens e histórico para conter latência e custo à medida que a base cresce `[G]` `[Backend]`
- [x] **Proteção contra rate limiting no Firestore** — `loadMessages` e `loadProblems` sem throttle; usuários com muitos dados podem gerar leituras excessivas `[M]` `[Backend]`
- [x] **Adicionar automação de atualização e auditoria de dependências** — configurar Dependabot para npm/GitHub Actions e auditoria agendada no CI `[M]` `[DevOps]`
- [x] **Modernizar o runner de testes e observabilidade de CI** — migrar lista manual para descoberta (Node Test Runner/Vitest), adicionar timeout por teste, cobertura, JUnit e artefatos de falha `[G]` `[QA]`
- [x] **Adicionar testes E2E de navegador** — cobrir boot do PWA, erro de autenticação, navegação e CRUD com Firebase mockado ou Emulator `[G]` `[QA]`
- [x] **Evoluir o typecheck de sintaxe para contratos JavaScript** — adotar JSDoc e TypeScript com `allowJs`/`checkJs` incrementalmente, validando imports e APIs além de parsing `[G]` `[QA]`
- [x] **Resetar `copyCount` diário via Cloud Function agendada (Firebase) au invés do timer no cliente** — `resetDailyCounts()` em `ranking.js` depende de a aba estar aberta à meia-noite `[M]` `[Backend]`
- [x] **Proteger o API Tester contra destinos e credenciais sensíveis** — bloquear loopback/rede privada e HTTP, confirmar host/método antes do envio e mascarar `Authorization` no histórico `[M]` `[Arch]`
- [x] **Restringir a Content Security Policy (CSP)** — remover gradualmente `unsafe-inline` e limitar `connect-src`/`img-src` aos domínios estritamente necessários `[M]` `[Arch]`
- [x] **Versionar e testar regras de segurança do Firestore** — garantir isolamento dos dados por `uid` e validar privilégios administrativos no servidor, não apenas pela interface `[G]` `[Backend]`
- [x] **Mover as chamadas de IA para backend/serverless** — não persistir chaves de provedores no `localStorage`; aplicar autenticação, rate limiting e controle centralizado de custos `[G]` `[Backend]`
- [x] **Corrigir textos com codificação quebrada** — normalizar UTF-8 em mensagens visíveis e cobrir strings críticas com testes `[P]` `[Bug]`
- [x] **Preservar `Ctrl+F` nativo do navegador** — mover o filtro local para `/` ou `Alt+F` e atualizar a ajuda `[P]` `[Accessibility]`
- [x] **Corrigir Enter na Command Palette** — abrir/navegar para o resultado selecionado; manter copiar como ação secundária `[P]` `[UX]`
- [x] **Adicionar landmarks semânticos à estrutura principal** — usar `header`, `main` e `nav`; tornar o destino do skip-link focável `[P]` `[Accessibility]`
- [x] **Adicionar contatos reais de suporte (WhatsApp/e-mail) no painel de Ajuda** `[P]` `[UX]`
- [x] **Anunciar carregamentos para leitores de tela** — substituir a barra `aria-hidden` por região `aria-live` e aplicar `aria-busy` aos conteúdos atualizados `[P]` `[Accessibility]`
- [x] **Centralizar acessibilidade dos modais** — garantir foco inicial, trap de foco, Escape e retorno de foco para Ajuda, IA, exportação e departamentos `[M]` `[Accessibility]`
- [x] **Executar explicitamente todos os gates no GitHub Actions** — adicionar etapas próprias para `typecheck`, `build` e `validate:port-denylist`, sem depender da cobertura indireta da suíte `[P]` `[DevOps]`
- [x] **Corrigir o runner da suíte de testes** — garantir execução de todos os arquivos registrados no runner `[M]` `[QA]`
- [x] **Criar gates locais de typecheck, build e validação de portas** — adicionar scripts npm, cobertura automatizada e alinhar CI ao Node 22/24 `[M]` `[QA]`
- [x] **Busca inline em tempo real dentro da lista de mensagens (Ctrl+F dentro da aba ativa)** — `enhancements.js` já tem base, mas sem highlight dos resultados `[M]` `[UX]`
- [x] **Indicador visual de problemas sem solução cadastrada** — hoje não há diferenciação visual `[P]` `[UI]`
- [x] **Filtro por status da solução (Confirmada / Em teste / Obsoleta) na listagem de problemas** `[M]` `[UX]`
- [x] **Command Palette universal (`Ctrl+K`) para busca simultânea em mensagens, problemas, links e ferramentas** `[G]` `[UX]`
- [x] **Duplicar problema com todas as soluções** `[P]` `[UX]`
- [x] **Duplicar mensagem/problema com um clique** — evita recriar entradas similares do zero `[P]` `[UX]`
- [x] **`sw.js`: Corrigir caminhos de pre-cache legados** — erros 404 ao instalar PWA pela primeira vez `[G]` `[Bug]`
