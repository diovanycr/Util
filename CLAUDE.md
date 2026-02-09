# CLAUDE.md — Respostas Automáticas

## Visão Geral do Projeto

**Respostas Automáticas** é uma aplicação web client-side para gerenciamento de respostas automáticas de mensagens. Oferece controle de acesso por papéis (admin/usuário), CRUD de mensagens com reordenação via drag-and-drop, importação/exportação e sistema de lixeira com exclusão reversível. A interface é em **Português (pt-BR)**.

## Stack Tecnológica

- **Linguagem:** JavaScript puro (módulos ES6)
- **Marcação/Estilo:** HTML5, CSS3 com variáveis CSS (custom properties)
- **Backend:** Nenhum — totalmente client-side, Firebase cuida dos dados e autenticação
- **Banco de Dados:** Cloud Firestore (NoSQL)
- **Autenticação:** Firebase Authentication (e-mail/senha)
- **Dependências via CDN:**
  - Firebase SDK v10.12.2
  - Font Awesome 6.5.1
  - Google Fonts (Inter)

**Não há etapa de build**, nem bundler, nem package.json, nem Node.js. Os arquivos são servidos como assets estáticos diretamente.

## Estrutura de Arquivos

```
resposta2/
├── index.html        # HTML single-page (login, admin, usuário, modais)
├── style.css         # Todos os estilos, variáveis CSS, breakpoints responsivos
└── js/
    ├── app.js        # Ponto de entrada — inicializa módulos no DOMContentLoaded
    ├── firebase.js   # Configuração Firebase, exporta app/auth/db/secondaryAuth/el()
    ├── auth.js       # Fluxo de login, monitor de sessão (onAuthStateChanged), logout
    ├── admin.js      # Admin: criar usuário, listar, bloquear/desbloquear, resetar senha, excluir
    ├── messages.js   # Usuário: CRUD de mensagens, drag-and-drop, importar/exportar, lixeira
    ├── modal.js      # Modal de alerta + modal de confirmação com callbacks
    └── user.js       # Helper: verificação isAdmin(user)
```

## Arquitetura

### Grafo de Dependências entre Módulos

```
app.js
 ├── auth.js      → firebase.js, modal.js, admin.js, messages.js
 ├── admin.js     → firebase.js, modal.js
 └── modal.js     → firebase.js
```

- `app.js` é o ponto de entrada, carregado como `<script type="module">`.
- Todos os módulos importam do Firebase via URLs CDN diretamente (sem npm/pacotes locais).
- `firebase.js` exporta instâncias compartilhadas: `app`, `auth`, `db`, `secondaryAuth` e o helper DOM `el()`.
- Uma instância secundária do Firebase (`secondaryAuth`) é usada para criação de usuários pelo admin, evitando deslogar o admin atual.

### Modelo de Dados no Firestore

**Coleção `users`:**
```
{uid}/
  username: string (minúsculo)
  email: string (minúsculo)
  role: "admin" | "user"
  blocked: boolean
  createdAt: string ISO
```

**Subcoleção `users/{uid}/messages`:**
```
{messageId}/
  text: string
  order: number
  deleted: boolean       # flag de exclusão reversível (soft-delete)
  createdAt: number      # timestamp via Date.now()
  updatedAt: number      # opcional, definido ao restaurar na importação
```

### Fluxo de Autenticação

1. O usuário digita o **nome de usuário** (não o e-mail) na tela de login.
2. `auth.js` busca o e-mail correspondente na coleção `users` do Firestore pelo campo `username`.
3. `signInWithEmailAndPassword` do Firebase autentica com o e-mail encontrado.
4. `onAuthStateChanged` verifica a flag `blocked` — usuários bloqueados são deslogados imediatamente.
5. Com base no `role`, o painel de admin ou de usuário é exibido.

## Convenções de Código

### Nomenclatura

| Contexto | Convenção | Exemplos |
|----------|-----------|----------|
| Variáveis/Funções | camelCase | `currentUserId`, `loadMessages()` |
| IDs de elementos HTML | camelCase com prefixo | `btnLogin`, `msgList`, `newMsgBox` |
| Classes CSS | kebab-case | `user-row`, `btn-primary`, `modal-overlay` |
| Variáveis CSS | kebab-case | `--primary`, `--bg`, `--danger` |
| IDs de botões | `btn[Nome]` | `btnLogin`, `btnExport`, `btnTrashToggle` |
| IDs de inputs (formulários de criação) | `new[Campo]` | `newUser`, `newEmail`, `newPass` |
| Containers de listas | `[entidade]List` | `userList`, `msgList`, `trashList` |

### Acesso ao DOM

Todas as chamadas `getElementById` usam o helper compartilhado:
```js
import { el } from './firebase.js';
el('btnLogin')  // equivalente a document.getElementById('btnLogin')
```

### Alternância de Visibilidade

Elementos são exibidos/ocultados usando a classe CSS `.hidden` (`display: none !important`) e, em alguns casos, atribuição direta de `style.display` para garantir confiabilidade.

### Padrão de Tratamento de Erros

```js
try {
    // operação Firebase
} catch (error) {
    console.error("Contexto descritivo:", error);
    showModal("Mensagem amigável em português para o usuário");
}
```

### Feedback ao Usuário

- **Modais** (`showModal`): Para erros e alertas informativos.
- **Modais de confirmação** (`openConfirmModal`): Para ações destrutivas; aceita callbacks de confirmação e cancelamento.
- **Toasts** (`showToast`): Para feedback temporário de sucesso (desaparece após 2s).

### Exclusão Reversível (Soft Delete)

Mensagens usam `deleted: boolean` ao invés de serem removidas do Firestore. A lixeira exibe itens com `deleted: true`. "Esvaziar lixeira" executa as chamadas `deleteDoc` de fato.

## Desenvolvimento

### Executando Localmente

Sirva a raiz do projeto com qualquer servidor HTTP estático. Módulos ES6 exigem servidor (não funciona via `file://`):

```bash
# Python
python3 -m http.server 8000

# Node (npx)
npx serve .
```

Depois abra `http://localhost:8000`.

### Sem Build / Sem Testes / Sem Linting

Este projeto não possui etapa de build, suite de testes ou linter configurado. Alterações entram em vigor imediatamente ao recarregar a página.

### Configuração do Firebase

As credenciais do Firebase estão fixas em `js/firebase.js`. Isso é padrão para apps Firebase client-side — a segurança é garantida pelas Regras de Segurança do Firestore no Console do Firebase, não pela ocultação do config.

## Comportamentos Importantes a Preservar

- **Login por nome de usuário:** Usuários fazem login com username, não e-mail. A busca do e-mail é feita no Firestore.
- **Auth secundário para criação de usuários:** `secondaryAuth` evita que o admin seja deslogado ao criar novos usuários.
- **Ordenação por drag-and-drop:** Mensagens possuem campo `order` que é persistido no Firestore após cada reordenação.
- **Deduplicação na importação:** Ao importar um arquivo `.txt`, mensagens existentes são detectadas e o usuário é consultado sobre duplicatas.
- **Layout responsivo:** O grid muda para coluna única em 768px. O botão da lixeira fica fixo na parte inferior da viewport.

## Padrões Comuns de Modificação

- **Adicionar nova seção na página:** Adicione HTML no `index.html` (oculto por padrão), alterne visibilidade em `auth.js` com base no role.
- **Adicionar nova operação no Firestore:** Importe funções do Firestore pela URL CDN no módulo correspondente, use `db` de `firebase.js`.
- **Adicionar nova ação na UI:** Vincule event listener na função `init*` do módulo, use `el()` para acesso ao DOM.
- **Adicionar novo fluxo de modal:** Use `showModal()` para alertas ou `openConfirmModal(onConfirm, onCancel)` para confirmações.
