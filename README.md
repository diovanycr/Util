# 🛠️ PainelAtende

> Painel web de atendimento ao cliente com mensagens prontas, base de conhecimento, ferramentas de diagnóstico e assistente de IA — feito para equipes de suporte técnico.

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Atalhos de Teclado](#-atalhos-de-teclado)
- [Testes](#-testes)
- [Changelog](#-changelog)
- [Backlog](#-backlog)
- [Licença](#-licença)

---

## 💡 Sobre o Projeto

O **PainelAtende** é uma aplicação web PWA desenvolvida para agilizar o atendimento ao cliente em equipes de suporte técnico. Centraliza mensagens prontas personalizáveis, uma base de conhecimento de problemas e soluções, links úteis, ferramentas de diagnóstico técnico e um assistente de IA para geração de respostas empáticas — tudo acessível com poucos cliques ou atalhos de teclado.

Projetado para funcionar ao lado do CRM/WhatsApp sem ocupar espaço, com modo pop-out e tema escuro.

---

## ✨ Funcionalidades

### 💬 Mensagens Prontas
- Cadastro de mensagens por categoria e departamento
- Substituição dinâmica do placeholder `{usuario}` pelo nome do atendente
- Filtro por horário (Bom dia / Boa tarde / Boa noite)
- Filtro de favoritos, ordenação por mais copiadas
- **Busca inline em tempo real** com `Ctrl+F` e highlight dos termos encontrados
- Duplicação com 1 clique, drag-and-drop para reordenar
- Importação/exportação em `.txt` e `.json`

### 🔧 Base de Conhecimento (Problemas & Soluções)
- Cadastro de problemas com múltiplas soluções por card
- Status por solução: ✅ Confirmada · 🧪 Em teste · ❌ Obsoleta
- Filtro por status de solução
- **Indicador visual** de problemas sem solução cadastrada (`⚠️ Sem solução`)
- Tags coloridas por categoria, filtro e busca
- Duplicação com 1 clique, drag-and-drop para reordenar
- Exportação de manual em PDF/HTML para treinamento

### 🔗 Links Úteis
- Links organizados por categoria com favicon automático
- Ordenação por **mais clicados** (do mais para o menos acessado)
- Drag-and-drop para reordenar, filtro e busca

### 🔍 Command Palette (`Ctrl+K`)
- Busca simultânea em mensagens, problemas, links e ferramentas
- Acesso rápido a qualquer seção ou ação do sistema

### 🤖 Assistente de IA
- Geração de respostas empáticas e profissionais
- Reescrita e melhoria de textos de mensagens e soluções
- Suporte a múltiplos provedores (Gemini / OpenAI)

### 🛠️ Ferramentas Técnicas (aba Sistemas)
| Ferramenta | Descrição |
|---|---|
| **Port Opener** | Gerador de scripts de abertura de portas para firewall/NAT |
| **ESC/POS Generator** | Geração de comandos de impressão para impressoras térmicas |
| **Status Checker** | Painel de status de SEFAZ e gateways de pagamento em tempo real |
| **Network Diagnostics** | Calculadora IP/Subrede e testador de porta de dispositivos PDV |
| **Decision Tree** | Guias passo a passo interativos para triagem de problemas |
| **Script Generator** | Gerador de scripts SQL/CMD/PowerShell com variáveis dinâmicas |
| **API Tester** | Testador rápido de endpoints REST/Webhooks |
| **File Validator** | Validador de XML NF-e/NFC-e e arquivos AFD de ponto eletrônico |
| **Doc Validator** | Validador/Gerador de CPF, CNPJ, PIS e Chave de Acesso NF-e |

### 📊 Métricas & Ranking
- Dashboard de analytics de atendimento com gráficos
- Ranking de mensagens e soluções mais utilizadas
- Exportação de relatório em PDF

### ⚙️ Administração
- Gestão de usuários (criação, bloqueio, exclusão)
- Controle de acesso por perfil (Admin / Atendente)
- Backups automáticos

---

## 🏗️ Arquitetura

```
Util/
├── index.html              # Ponto de entrada da aplicação
├── sw.js                   # Service Worker (PWA / offline)
├── manifest.json           # Manifesto PWA
├── css/                    # Estilos por domínio
│   ├── main.css            # Importação centralizada
│   ├── base.css            # Design system (tokens, variáveis CSS)
│   ├── messages.css
│   ├── problems.css
│   ├── links.css
│   └── ...
├── js/
│   ├── app.js              # Bootstrap da aplicação
│   ├── core/               # Utilitários compartilhados
│   │   ├── utils.js        # Helpers (escapeHtml, debounce, etc.)
│   │   ├── firebase.js     # Inicialização do Firestore
│   │   ├── modal.js        # Modais reutilizáveis
│   │   ├── shortcuts.js    # Atalhos de teclado globais
│   │   ├── theme.js        # Tema claro/escuro
│   │   └── toast.js        # Notificações toast
│   ├── modules/            # Módulos de funcionalidade
│   │   ├── auth.js
│   │   ├── messages.js / messages/
│   │   ├── problems.js / problems/
│   │   ├── links.js
│   │   ├── search.js
│   │   ├── analytics.js
│   │   ├── history.js
│   │   └── aiAssistant.js
│   └── tools/              # Ferramentas técnicas (carregadas sob demanda)
│       ├── portOpener.js
│       ├── escPos.js
│       ├── statusChecker.js
│       ├── decisionTree.js
│       └── ...
├── scripts/
│   └── backlog.js          # CLI de gerenciamento do backlog
└── tests/                  # Suíte de testes automatizados
    ├── run-all.js
    └── *.test.js
```

**Backend:** Firebase Firestore (banco de dados NoSQL em tempo real) + Firebase Authentication.

---

## 🧰 Tecnologias

- **Frontend:** HTML5 · CSS3 (Vanilla, Design System com variáveis CSS) · JavaScript ES Modules
- **Backend:** [Firebase Firestore](https://firebase.google.com/docs/firestore) · [Firebase Auth](https://firebase.google.com/docs/auth)
- **PWA:** Service Worker · Web App Manifest
- **IA:** Google Gemini API · OpenAI API (via FuturaSearchWidget)
- **Dev Tools:** ESLint · Prettier · Node.js (testes e scripts)

---

## 📦 Pré-requisitos

- [Node.js](https://nodejs.org/) `>= 18`
- Conta no [Firebase](https://console.firebase.google.com/) com projeto configurado (Firestore + Authentication)
- Chave de API do Gemini ou OpenAI (opcional, para funcionalidades de IA)

---

## 🚀 Instalação e Configuração

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/painelatende.git
cd painelatende

# 2. Instale as dependências de desenvolvimento
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com as credenciais do seu projeto Firebase

# 4. Sirva o projeto localmente (qualquer servidor estático)
npx serve .
# ou
python -m http.server 8080
```

> ⚠️ Por ser uma aplicação puramente client-side com ES Modules, não abra o `index.html` diretamente pelo sistema de arquivos (`file://`). Use sempre um servidor HTTP local.

---

## 🔑 Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e preencha com as credenciais do seu projeto Firebase:

```env
FIREBASE_API_KEY=sua_api_key
FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
FIREBASE_PROJECT_ID=seu_projeto
FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=000000000000
FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxxxxxx

# Opcional — Assistente de IA
GEMINI_API_KEY=sua_chave_gemini
OPENAI_API_KEY=sua_chave_openai
```

---

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
|---|---|
| `Ctrl+K` | Abrir Command Palette (busca global) |
| `Ctrl+F` | Busca inline na lista de mensagens |
| `N` | Nova mensagem (na aba Mensagens) |
| `P` | Novo problema (na aba Problemas) |
| `1` | Navegar para aba Mensagens |
| `2` | Navegar para aba Problemas |
| `3` | Navegar para aba Links Úteis |
| `4` | Navegar para aba Sistemas |
| `Esc` | Fechar formulário / modal aberto |

---

## 🧪 Testes

O projeto possui uma suíte de testes automatizados com **98 testes**, 0 falhas.

```bash
# Executar todos os testes
npm test

# Executar um teste específico
node tests/message-inline-search.test.js
```

**Arquivos de teste:**

| Arquivo | Cobertura |
|---|---|
| `backlog.test.js` | CLI de backlog (add, done, release) |
| `sw.test.js` | Integridade dos 88 assets do pre-cache do Service Worker |
| `command-palette.test.js` | Command Palette `Ctrl+K` |
| `duplication.test.js` | Duplicação de mensagens e problemas |
| `solution-status-filter.test.js` | Filtro por status de solução |
| `no-solution-indicator.test.js` | Indicador visual de problemas sem solução |
| `message-inline-search.test.js` | Busca inline `Ctrl+F` com highlight |
| `xss.test.js` | Regressão de XSS (escapeHtml/escapeAttr) |
| `modules.test.js` | Exports dos módulos principais |
| `utils.test.js` | Funções utilitárias (escapeHtml, debounce, etc.) |
| `utils-dom.test.js` | Helpers DOM com JSDOM |

```bash
# Lint
npm run lint

# Formatação
npm run format
```

---

## 📝 Changelog

O histórico completo de versões está em [CHANGELOG.md](./CHANGELOG.md).

**Última versão:** `v1.1.0` — Correções de pré-cache PWA, EventBus, lazy-loading de ferramentas, suporte a temas e melhorias de acessibilidade.

---

## 📌 Backlog

O backlog de melhorias planejadas está em [backlog.md](./backlog.md), organizado por domínio:

- 🐛 Bugs & Críticos
- ⚙️ Qualidade Técnica
- 🚀 UX / Produtividade
- 📊 Analytics / Relatórios
- 🤖 IA & Automação

---

## 📄 Licença

Este projeto é de uso privado. Todos os direitos reservados.
