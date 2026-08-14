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

    const input = el('globalSearchInput');
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

async function runSearch(query) {
    const results = el('globalSearchResults');
    if (!query || query.length < 2) {
        results.innerHTML = '<p class="search-hint">Digite pelo menos 2 caracteres...</p>';
        resetSearchIndex();
        return;
    }

    const q = query.toLowerCase();

    try {
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

        if (msgMatches.length === 0 && probMatches.length === 0 && linkMatches.length === 0) {
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

        buildSection('message', 'Mensagens', msgMatches, item => {
            const row = document.createElement('div');
            row.className = 'search-result-item';
            row.setAttribute('role', 'option');
            row.innerHTML = `
                <span class="search-result-text">${highlight(item.text, query)}</span>
                <button class="btn ghost search-copy-btn" title="Copiar"><i class="fa-solid fa-copy"></i></button>
            `;
            row.querySelector('.search-copy-btn').onclick = async (e) => {
                e.stopPropagation();
                await navigator.clipboard.writeText(item.text);
                showToast("Copiado!");
                closeSearch();
            };
            row.onclick = async () => {
                await navigator.clipboard.writeText(item.text);
                showToast("Copiado!");
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
                document.querySelector('[data-tab="tabProblems"]')?.click();
                const problemSearch = el('problemSearch');
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
            row.querySelector('.search-goto-btn').onclick = (e) => {
                e.stopPropagation();
                if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer');
                closeSearch();
            };
            row.onclick = () => {
                document.querySelector('[data-tab="tabLinks"]')?.click();
                const linkSearch = el('linkSearch');
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
