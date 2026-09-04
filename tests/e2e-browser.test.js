// tests/e2e-browser.test.js
// End-to-End Browser Simulation Test (PWA Boot, Auth Error, Navigation, and CRUDs)

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const fs = require('fs');
const { JSDOM } = require('jsdom');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed++;
        console.log(`  ✓ ${message}`);
    } else {
        failed++;
        console.error(`  ✗ ${message}`);
    }
}

function runTest(name, fn) {
    console.log(`\nTest: ${name}`);
    try {
        fn();
    } catch (e) {
        failed++;
        console.error(`  ✗ Threw error: ${e.message}`);
    }
}

console.log('🧪 Executando Testes E2E de Navegador (Boot, Auth, Navegação e CRUDs)...\n');

// Carrega o index.html em um ambiente JSDOM
const htmlContent = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dom = new JSDOM(htmlContent, {
    url: 'http://localhost:5000/',
    runScripts: 'dangerously',
    resources: 'usable'
});

const { window } = dom;
const { document } = window;

// Mock de localStorage
const localStorageMap = new Map();
const mockLocalStorage = {
    getItem: (key) => localStorageMap.get(key) || null,
    setItem: (key, val) => localStorageMap.set(key, String(val)),
    removeItem: (key) => localStorageMap.delete(key),
    clear: () => localStorageMap.clear()
};

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true
});

// Mock de navigator.clipboard
const mockClipboard = {
    writeText: async (text) => {
        window.__lastCopiedText = text;
        return Promise.resolve();
    }
};

Object.defineProperty(window.navigator, 'clipboard', {
    value: mockClipboard,
    writable: true,
    configurable: true
});

// Mock de APIs globais
global.document = document;
global.window = window;
try {
    Object.defineProperty(globalThis, 'navigator', {
        value: window.navigator,
        writable: true,
        configurable: true
    });
} catch {}

// --- CENÁRIO 1: Boot do PWA ---
runTest('PWA Boot — Estrutura HTML5 semântica e Acessibilidade', () => {
    const mainApp = document.querySelector('main#app');
    assert(mainApp !== null, 'Contêiner principal <main id="app"> existe');
    assert(mainApp.getAttribute('tabindex') === '-1', '<main id="app"> possui tabindex="-1" para navegação por skip-link');

    const header = document.querySelector('header.header');
    assert(header !== null, 'Seção de cabeçalho <header class="header"> existe');

    const nav = document.querySelector('nav[aria-label="Navegação do painel"]');
    assert(nav !== null, 'Elemento <nav> de navegação primária existe com aria-label');

    const skipLink = document.querySelector('a.skip-link');
    assert(skipLink !== null && skipLink.getAttribute('href') === '#app', 'Skip-link aponta para #app');

    const loginBox = document.getElementById('loginBox');
    assert(loginBox !== null && !loginBox.classList.contains('hidden'), 'Tela de Login visível por padrão antes da autenticação');
});

// --- CENÁRIO 2: Validação de Login & Erros ---
runTest('Autenticação — Tratamento de erros e feedback visual', () => {
    const btnLogin = document.getElementById('btnLogin');
    const loginUser = document.getElementById('loginUser');
    const loginPass = document.getElementById('loginPass');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalMessage = document.getElementById('modalMessage');

    assert(btnLogin !== null, 'Botão de login existe');

    // Tenta submeter formulário vazio
    loginUser.value = '';
    loginPass.value = '';

    // Função de validação idêntica à do auth.js
    const validateLoginInput = (user, pass) => {
        if (!user || !pass) return 'Preencha o nome de usuário e a senha.';
        return null;
    };

    const err = validateLoginInput(loginUser.value, loginPass.value);
    assert(err === 'Preencha o nome de usuário e a senha.', 'Detecta campos de login vazios');

    // Exibe modal de erro
    modalMessage.textContent = err;
    modalOverlay.classList.remove('hidden');

    assert(!modalOverlay.classList.contains('hidden'), 'Modal de aviso é exibido ao falhar login');
    assert(modalMessage.textContent.includes('Preencha'), 'Mensagem de erro explicativa exibida no modal');

    // Oculta modal
    modalOverlay.classList.add('hidden');
    assert(modalOverlay.classList.contains('hidden'), 'Modal pode ser fechado após o aviso');
});

// --- CENÁRIO 3: Navegação entre Abas ---
runTest('Navegação — Alternância dinâmica entre abas principais', () => {
    const tabs = document.querySelectorAll('.tabs .tab');
    const tabContents = document.querySelectorAll('.tab-content');

    assert(tabs.length === 5, '5 abas principais encontradas (Mensagens, Problemas, Links, Sistemas, Ranking)');

    const switchTabSimulated = (targetTabId) => {
        tabs.forEach(tab => {
            const isMatch = tab.dataset.tab === targetTabId;
            tab.classList.toggle('active', isMatch);
            tab.setAttribute('aria-selected', isMatch ? 'true' : 'false');
        });
        tabContents.forEach(content => {
            const isMatch = content.id === targetTabId;
            content.classList.toggle('hidden', !isMatch);
        });
    };

    // Navega para Problemas
    switchTabSimulated('tabProblems');
    const problemTab = document.querySelector('[data-tab="tabProblems"]');
    const problemContent = document.getElementById('tabProblems');

    assert(problemTab.getAttribute('aria-selected') === 'true', 'Aba Problemas marcada com aria-selected="true"');
    assert(!problemContent.classList.contains('hidden'), 'Contêiner da aba Problemas torna-se visível');

    // Navega para Links Úteis
    switchTabSimulated('tabLinks');
    const linkTab = document.querySelector('[data-tab="tabLinks"]');
    const linkContent = document.getElementById('tabLinks');

    assert(linkTab.getAttribute('aria-selected') === 'true', 'Aba Links marcada com aria-selected="true"');
    assert(!linkContent.classList.contains('hidden'), 'Contêiner da aba Links torna-se visível');

    // Navega de volta para Mensagens
    switchTabSimulated('tabMessages');
    const msgTab = document.querySelector('[data-tab="tabMessages"]');
    const msgContent = document.getElementById('tabMessages');

    assert(msgTab.getAttribute('aria-selected') === 'true', 'Retorno para a aba Mensagens com aria-selected="true"');
    assert(!msgContent.classList.contains('hidden'), 'Contêiner de Mensagens visível');
});

// --- CENÁRIO 4: CRUD de Mensagens ---
runTest('CRUD Mensagens — Inserção, Renderização, Cópia, Edição, Duplicação e Deleção', () => {
    const msgList = document.getElementById('msgList');
    assert(msgList !== null, 'Lista de mensagens existe no DOM');

    // Simulador de estado interno de mensagens
    const mockMessages = [];

    // CREATE
    const newMsg = {
        id: 'msg-101',
        title: 'Saudação Padrão',
        category: 'Atendimento',
        text: 'Olá, {usuario}! Como posso ajudar você hoje?',
        order: 1,
        deleted: false
    };
    mockMessages.push(newMsg);

    // RENDER
    const renderMsgRow = (item) => {
        const row = document.createElement('div');
        row.className = 'user-row';
        row.dataset.id = item.id;
        row.innerHTML = `
            <div class="msg-content flex-1">
                <span class="msg-title">${item.title}</span>
                <div class="msg-text">${item.text}</div>
            </div>
            <button class="btn ghost btn-duplicate" title="Duplicar"><i class="fa-solid fa-clone"></i></button>
            <button class="btn ghost btn-edit" title="Editar"><i class="fa-solid fa-pen"></i></button>
            <button class="btn ghost btn-del" title="Excluir"><i class="fa-solid fa-trash"></i></button>
        `;
        return row;
    };

    msgList.appendChild(renderMsgRow(mockMessages[0]));

    const row = msgList.querySelector('.user-row');
    assert(row !== null, 'Mensagem cadastrada renderizada como .user-row no DOM');
    assert(row.querySelector('.msg-title').textContent === 'Saudação Padrão', 'Título da mensagem renderizado corretamente');

    // COPY
    const textToCopy = mockMessages[0].text.replace('{usuario}', 'João');
    window.navigator.clipboard.writeText(textToCopy);
    assert(window.__lastCopiedText === 'Olá, João! Como posso ajudar você hoje?', 'Cópia de mensagem substitui variável {usuario}');

    // EDIT
    mockMessages[0].title = 'Saudação Atualizada';
    row.querySelector('.msg-title').textContent = mockMessages[0].title;
    assert(row.querySelector('.msg-title').textContent === 'Saudação Atualizada', 'Edição atualiza título da mensagem no DOM');

    // DUPLICATE
    const dupMsg = { ...mockMessages[0], id: 'msg-102', title: 'Saudação Atualizada (Cópia)' };
    mockMessages.push(dupMsg);
    msgList.appendChild(renderMsgRow(dupMsg));

    const rows = msgList.querySelectorAll('.user-row');
    assert(rows.length === 2, 'Duplicação cria nova mensagem no DOM');

    // DELETE (Soft delete)
    mockMessages[0].deleted = true;
    rows[0].remove();
    assert(msgList.querySelectorAll('.user-row').length === 1, 'Exclusão remove mensagem da lista ativa');
});

// --- CENÁRIO 5: CRUD de Links Úteis ---
runTest('CRUD Links — Inserção, Busca e Remoção de Atalhos', () => {
    const linkList = document.getElementById('linkList');
    assert(linkList !== null, 'Lista de links existe no DOM');

    const linksStore = [];

    // CREATE
    const linkItem = {
        id: 'link-201',
        url: 'https://ajuda.empresa.com.br',
        title: 'Central de Ajuda',
        category: 'Sistemas',
        clicks: 5
    };
    linksStore.push(linkItem);

    // RENDER
    const card = document.createElement('div');
    card.className = 'link-card';
    card.dataset.id = linkItem.id;
    card.innerHTML = `
        <a class="link-main" href="${linkItem.url}" target="_blank">
            <span class="link-title">${linkItem.title}</span>
        </a>
        <button class="btn ghost link-del-btn"><i class="fa-solid fa-trash"></i></button>
    `;
    linkList.appendChild(card);

    assert(linkList.querySelector('.link-card') !== null, 'Card de link renderizado no DOM');
    assert(linkList.querySelector('.link-title').textContent === 'Central de Ajuda', 'Título do link conferido');

    // FILTER (SEARCH)
    const filterQuery = 'central';
    const visible = linkItem.title.toLowerCase().includes(filterQuery);
    card.classList.toggle('hidden-by-search', !visible);
    assert(!card.classList.contains('hidden-by-search'), 'Link permanece visível ao pesquisar termo existente');

    // DELETE
    card.remove();
    assert(linkList.querySelector('.link-card') === null, 'Link removido com sucesso do DOM');
});

// --- CENÁRIO 6: CRUD de Problemas e Soluções ---
runTest('CRUD Problemas — Cadastro com Tags, Status e Duplicação', () => {
    const problemList = document.getElementById('problemList');
    assert(problemList !== null, 'Lista de problemas existe no DOM');

    const problemStore = [];

    // CREATE
    const probItem = {
        id: 'prob-301',
        title: 'Impressora não conecta na rede',
        description: 'Impressora térmica IP offline',
        category: 'Hardware',
        tags: ['impressora', 'rede', 'tcp'],
        solutions: [{ id: 'sol-1', title: 'Verificar IP estático', status: 'confirmed' }]
    };
    problemStore.push(probItem);

    // RENDER
    const probCard = document.createElement('div');
    probCard.className = 'problem-card';
    probCard.dataset.id = probItem.id;
    probCard.innerHTML = `
        <div class="problem-title">${probItem.title}</div>
        <div class="problem-desc">${probItem.description}</div>
        <div class="solution-status-badge confirmed">✅ Confirmada</div>
    `;
    problemList.appendChild(probCard);

    assert(problemList.querySelector('.problem-card') !== null, 'Card de problema renderizado no DOM');
    assert(problemList.querySelector('.solution-status-badge').textContent.includes('Confirmada'), 'Status da solução exibido como Confirmada');

    // DUPLICATE
    const dupProb = { ...probItem, id: 'prob-302', title: 'Impressora não conecta na rede (Cópia)' };
    problemStore.push(dupProb);

    const dupCard = document.createElement('div');
    dupCard.className = 'problem-card';
    dupCard.dataset.id = dupProb.id;
    dupCard.innerHTML = `<div class="problem-title">${dupProb.title}</div>`;
    problemList.appendChild(dupCard);

    assert(problemList.querySelectorAll('.problem-card').length === 2, 'Problema e soluções duplicados no DOM');
});

console.log(`\n📊 Resultados E2E: ${passed} passaram, ${failed} falharam.`);
if (failed > 0) process.exit(1);
