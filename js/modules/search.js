/**
 * search.js — Busca global (Ctrl+K)
 * Pesquisa simultaneamente em mensagens e problemas do usuário logado
 */

import { el } from '../core/firebase.js';
import { allMessages } from './messages.js';
import { allProblems } from './problems.js';
import { allLinks } from './links.js';
import { openSearch, closeSearch, resetSearchIndex } from '../core/shortcuts.js';
import { showToast } from '../core/toast.js';
import { escapeHtml, normalizeSolutions } from '../core/utils.js';

let currentUserId = null;
let searchInitialized = false;
let _searchHandlers = {};

export function resetSearch() {
    if (_searchHandlers.modalClick) {
        const modal = el('globalSearchModal');
        if (modal) modal.removeEventListener('click', _searchHandlers.modalClick);
    }
    if (_searchHandlers.inputInput) {
        const input = el('globalSearchInput');
        if (input) input.removeEventListener('input', _searchHandlers.inputInput);
    }
    if (_searchHandlers.inputKeydown) {
        const input = el('globalSearchInput');
        if (input) input.removeEventListener('keydown', _searchHandlers.inputKeydown);
    }
    _searchHandlers = {};
    searchInitialized = false;
    currentUserId = null;
}

export function initSearch(uid) {
    currentUserId = uid;

    const input = /** @type {HTMLInputElement|null} */ (el('globalSearchInput'));
    const results = el('globalSearchResults');
    const modal = el('globalSearchModal');

    if (!input || !modal) return;

    if (searchInitialized) return;
    searchInitialized = true;

    // Fecha ao clicar fora
    _searchHandlers.modalClick = (e) => {
        if (e.target === modal) closeSearch();
    };
    modal.addEventListener('click', _searchHandlers.modalClick);

    // Busca ao digitar (debounce 200ms)
    let debounceTimer;
    _searchHandlers.inputInput = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => runSearch(input.value.trim()), 200);
    };
    input.addEventListener('input', _searchHandlers.inputInput);

    // Fecha com Esc
    _searchHandlers.inputKeydown = (e) => {
        if (e.key === 'Escape') closeSearch();
    };
    input.addEventListener('keydown', _searchHandlers.inputKeydown);
}

export const SYSTEM_TOOLS = [
    { key: 'portopener', name: 'Port Opener', icon: 'shield-halved', desc: 'Gera scripts para abrir portas no Firewall do Windows' },
    { key: 'futura', name: 'Futura Search (IA)', icon: 'robot', desc: 'Pesquise no manual e tire dúvidas do sistema com IA' },
    { key: 'escpos', name: 'ESC/POS Impressoras', icon: 'print', desc: 'Gera comandos brutos de corte, gaveta e avanço para impressoras térmicas' },
    { key: 'docvalidator', name: 'Documentos Fiscais', icon: 'file-contract', desc: 'Valide e gere CPF, CNPJ, PIS, IE e Chave NFe/NFCe' },
    { key: 'statuschecker', name: 'Status SEFAZ & Gateways', icon: 'signal', desc: 'Verifica disponibilidade dos serviços SEFAZ e adquirentes' },
    { key: 'apitester', name: 'Testes de APIs & Webhooks', icon: 'plug', desc: 'Teste endpoints REST/Webhooks: WooCommerce, VTEX, Mercado Livre' },
    { key: 'filevalidator', name: 'Arquivos Fiscais & Ponto', icon: 'file-code', desc: 'Valide XML de NFe/NFCe, parse de AFD/AFDT e extração de CNPJ/IE' },
    { key: 'ticketsummary', name: 'Sumário de Atendimento', icon: 'file-pen', desc: 'Gere resumos padronizados para Tickets/CRM' },
    { key: 'decisiontree', name: 'Árvore de Decisão', icon: 'diagram-project', desc: 'Guias interativos para diagnosticar falhas em PDV, Impressora, Ponto e E-commerce' },
    { key: 'networkdiag', name: 'Diagnóstico de Redes', icon: 'network-wired', desc: 'Calculadora IP/Subrede e testador de portas TCP para impressoras, balanças e REPs' },
    { key: 'scriptgen', name: 'Scripts & Comandos', icon: 'terminal', desc: 'Gere SQL, BAT e PowerShell com variáveis dinâmicas para suporte' }
];

const clickTab = (tab) => /** @type {HTMLElement|null} */ (document.querySelector(`[data-tab="${tab}"]`))?.click();
const clickSel = (sel) => /** @type {HTMLElement|null} */ (document.querySelector(sel))?.click();

export const SYSTEM_COMMANDS = [
    {
        name: 'Ir para Mensagens',
        desc: 'Navegar para a aba de respostas prontas',
        icon: 'message',
        action: () => clickTab('tabMessages')
    },
    {
        name: 'Ir para Problemas / Base de Conhecimento',
        desc: 'Navegar para a aba de problemas e soluções',
        icon: 'wrench',
        action: () => clickTab('tabProblems')
    },
    {
        name: 'Ir para Links Úteis',
        desc: 'Navegar para a aba de links rápidos',
        icon: 'link',
        action: () => clickTab('tabLinks')
    },
    {
        name: 'Ir para Ferramentas & Sistemas',
        desc: 'Navegar para a aba de ferramentas',
        icon: 'toolbox',
        action: () => clickTab('tabSistemas')
    },
    {
        name: 'Nova Mensagem',
        desc: 'Abrir formulário de cadastro de mensagem',
        icon: 'plus',
        action: () => {
            clickTab('tabMessages');
            clickSel('#btnNewMsg');
        }
    },
    {
        name: 'Novo Problema',
        desc: 'Abrir formulário de cadastro de problema',
        icon: 'plus',
        action: () => {
            clickTab('tabProblems');
            clickSel('#btnNewProblem');
        }
    },
    {
        name: 'Novo Link',
        desc: 'Abrir formulário de cadastro de link',
        icon: 'plus',
        action: () => {
            clickTab('tabLinks');
            clickSel('#btnNewLink');
        }
    },
    {
        name: 'Abrir Assistente de IA',
        desc: 'Gerar ou reescrever mensagem com IA',
        icon: 'wand-magic-sparkles',
        action: () => clickSel('#btnGlobalAiAssist')
    }
];

async function runSearch(query) {
    const results = el('globalSearchResults');
    if (!query || query.length < 2) {
        results.innerHTML = '<p class="search-hint">Digite pelo menos 2 caracteres para buscar mensagens, problemas, links, ferramentas ou comandos...</p>';
        resetSearchIndex();
        return;
    }

    const q = query.toLowerCase();

    try {
        const cmdMatches = SYSTEM_COMMANDS
            .filter(c => `${c.name} ${c.desc}`.toLowerCase().includes(q));

        const toolMatches = SYSTEM_TOOLS
            .filter(t => `${t.name} ${t.desc}`.toLowerCase().includes(q));

        const msgMatches = allMessages
            .filter(d => !d.deleted && ((d.text && d.text.toLowerCase().includes(q)) || (d.title && d.title.toLowerCase().includes(q)) || (d.category && d.category.toLowerCase().includes(q))));

        const probMatches = allProblems
            .filter(d => {
                const solutions = normalizeSolutions(d);
                const solText = solutions.map(s => s.text.replace(/<[^>]*>/g, '')).join(' ');
                const tags = Array.isArray(d.tags) ? d.tags.join(' ') : '';
                return `${d.title} ${d.description || ''} ${solText} ${tags}`.toLowerCase().includes(q);
            });

        const linkMatches = allLinks
            .filter(d => {
                const searchStr = `${d.title || ''} ${d.url || ''} ${d.category || ''} ${d.description || ''}`.toLowerCase();
                return searchStr.includes(q);
            });

        if (cmdMatches.length === 0 && toolMatches.length === 0 && msgMatches.length === 0 && probMatches.length === 0 && linkMatches.length === 0) {
            results.innerHTML = '<p class="search-hint">Nenhum resultado encontrado.</p>';
            resetSearchIndex();
            return;
        }

        results.innerHTML = '';
        resetSearchIndex();

        const buildSection = (icon, label, matches, renderRow) => {
            if (matches.length === 0) return;
            const section = document.createElement('div');
            section.innerHTML = `<p class="search-section-label"><i class="fa-solid fa-${icon}"></i> ${label} (${matches.length})</p>`;
            matches.slice(0, 5).forEach(item => section.appendChild(renderRow(item)));
            results.appendChild(section);
        };

        buildSection('terminal', 'Comandos & Ações', cmdMatches, item => {
            const row = document.createElement('div');
            row.className = 'search-result-item';
            row.setAttribute('role', 'option');
            row.innerHTML = `
                <div>
                    <span class="search-result-title"><i class="fa-solid fa-${item.icon}" style="margin-right:6px"></i> ${highlight(item.name, query)}</span>
                    <span class="search-result-desc">${highlight(item.desc, query)}</span>
                </div>
                <button class="btn ghost search-goto-btn" title="Executar"><i class="fa-solid fa-arrow-right"></i></button>
            `;
            row.onclick = () => {
                closeSearch();
                item.action();
            };
            return row;
        });

        buildSection('toolbox', 'Ferramentas do Sistema', toolMatches, item => {
            const row = document.createElement('div');
            row.className = 'search-result-item';
            row.setAttribute('role', 'option');
            row.innerHTML = `
                <div>
                    <span class="search-result-title"><i class="fa-solid fa-${item.icon}" style="margin-right:6px"></i> ${highlight(item.name, query)}</span>
                    <span class="search-result-desc">${highlight(item.desc, query)}</span>
                </div>
                <button class="btn ghost search-goto-btn" title="Abrir ferramenta"><i class="fa-solid fa-arrow-right"></i></button>
            `;
            row.onclick = () => {
                closeSearch();
                clickTab('tabSistemas');
                setTimeout(() => {
                    const toolBtn = /** @type {HTMLElement|null} */ (document.querySelector(`.po-tool-btn[data-tool="${item.key}"]`));
                    if (toolBtn) toolBtn.click();
                }, 50);
            };
            return row;
        });

        buildSection('message', 'Mensagens', msgMatches, item => {
            const row = document.createElement('div');
            row.className = 'search-result-item';
            row.setAttribute('role', 'option');
            row.innerHTML = `
                <div>
                    ${item.title ? `<span class="search-result-title">${highlight(item.title, query)}</span>` : ''}
                    <span class="search-result-desc">${highlight(item.text, query)}</span>
                </div>
                <button class="btn ghost search-copy-btn" title="Copiar mensagem" aria-label="Copiar mensagem"><i class="fa-solid fa-copy" aria-hidden="true"></i></button>
            `;
            const copyBtn = /** @type {HTMLElement|null} */ (row.querySelector('.search-copy-btn'));
            if (copyBtn) {
                copyBtn.onclick = async (e) => {
                    e.stopPropagation();
                    await navigator.clipboard.writeText(item.text);
                    showToast("Copiado!");
                    closeSearch();
                };
            }
            row.onclick = () => {
                clickTab('tabMessages');
                const msgSearch = /** @type {HTMLInputElement|null} */ (el('msgSearch'));
                if (msgSearch) {
                    msgSearch.value = item.title || item.text;
                    msgSearch.dispatchEvent(new Event('input'));
                }
                closeSearch();
            };
            return row;
        });

        buildSection('wrench', 'Problemas', probMatches, item => {
            const row = document.createElement('div');
            row.className = 'search-result-item';
            row.setAttribute('role', 'option');
            row.innerHTML = `
                <div>
                    <span class="search-result-title">${highlight(item.title, query)}</span>
                    ${item.description ? `<span class="search-result-desc">${highlight(item.description, query)}</span>` : ''}
                </div>
                <button class="btn ghost search-goto-btn" title="Ver problema"><i class="fa-solid fa-arrow-right"></i></button>
            `;
            row.onclick = () => {
                clickTab('tabProblems');
                const problemSearch = /** @type {HTMLInputElement|null} */ (el('problemSearch'));
                if (problemSearch) {
                    problemSearch.value = item.title;
                    problemSearch.dispatchEvent(new Event('input'));
                }
                closeSearch();
            };
            return row;
        });

        buildSection('link', 'Links Úteis', linkMatches, item => {
            const row = document.createElement('div');
            row.className = 'search-result-item';
            row.setAttribute('role', 'option');
            row.innerHTML = `
                <div>
                    <span class="search-result-title">${highlight(item.title || item.url, query)}</span>
                    ${item.url ? `<span class="search-result-desc">${highlight(item.url, query)}</span>` : ''}
                </div>
                <button class="btn ghost search-goto-btn" title="Abrir link" aria-label="Abrir link em nova aba"><i class="fa-solid fa-external-link" aria-hidden="true"></i></button>
            `;
            const gotoBtn = /** @type {HTMLElement|null} */ (row.querySelector('.search-goto-btn'));
            if (gotoBtn) {
                gotoBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer');
                    closeSearch();
                };
            }
            row.onclick = () => {
                clickTab('tabLinks');
                const linkSearch = /** @type {HTMLInputElement|null} */ (el('linkSearch'));
                if (linkSearch) {
                    linkSearch.value = item.title || item.url;
                    linkSearch.dispatchEvent(new Event('input'));
                }
                closeSearch();
            };
            return row;
        });

        // Adiciona IDs únicos e aria-selected inicial nos resultados
        const items = results.querySelectorAll('[role="option"]');
        items.forEach((item, i) => {
            item.id = `search-result-${i}`;
            item.setAttribute('aria-selected', 'false');
        });

    } catch (err) {
        console.error("Erro na busca global:", err);
        results.innerHTML = '<p class="search-hint">Erro ao buscar.</p>';
    }
}

function highlight(text, query) {
    if (!text) return '';
    // Escapa o texto primeiro para evitar XSS; depois aplica <mark> só no trecho da query
    const safeText = escapeHtml(String(text));
    const escapedQuery = escapeHtml(String(query)).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!escapedQuery) return safeText;
    return safeText.replace(new RegExp(`(${escapedQuery})`, 'gi'), '<mark>$1</mark>');
}
