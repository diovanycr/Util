/**
 * search.js — Busca global (Ctrl+K)
 * Pesquisa simultaneamente em mensagens e problemas do usuário logado
 */

import { db, el, collection, getDocs } from './firebase.js';
import { openSearch, closeSearch } from './shortcuts.js';
import { showToast } from './toast.js';

let currentUserId = null;

export function initSearch(uid) {
    currentUserId = uid;

    const input = el('globalSearchInput');
    const results = el('globalSearchResults');
    const modal = el('globalSearchModal');

    if (!input || !modal) return;

    // Fecha ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeSearch();
    });

    // Busca ao digitar (debounce 250ms)
    let debounceTimer;
    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => runSearch(input.value.trim()), 250);
    });

    // Fecha com Esc (capturado aqui também para garantir)
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSearch();
    });
}

async function runSearch(query) {
    const results = el('globalSearchResults');
    if (!query || query.length < 2) {
        results.innerHTML = '<p class="search-hint">Digite pelo menos 2 caracteres...</p>';
        return;
    }

    results.innerHTML = '<p class="search-hint">Buscando...</p>';
    const q = query.toLowerCase();

    try {
        const [msgsSnap, probsSnap] = await Promise.all([
            getDocs(collection(db, 'users', currentUserId, 'messages')),
            getDocs(collection(db, 'users', currentUserId, 'problems'))
        ]);

        const msgMatches = msgsSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(d => !d.deleted && d.text?.toLowerCase().includes(q));

        const probMatches = probsSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(d => {
                const solutions = normalizeSolutions(d);
                const solText = solutions.map(s => s.text.replace(/<[^>]*>/g, '')).join(' ');
                return `${d.title} ${d.description || ''} ${solText}`.toLowerCase().includes(q);
            });

        if (msgMatches.length === 0 && probMatches.length === 0) {
            results.innerHTML = '<p class="search-hint">Nenhum resultado encontrado.</p>';
            return;
        }

        results.innerHTML = '';

        if (msgMatches.length > 0) {
            const section = document.createElement('div');
            section.innerHTML = `<p class="search-section-label"><i class="fa-solid fa-message"></i> Mensagens (${msgMatches.length})</p>`;
            msgMatches.slice(0, 5).forEach(item => {
                const row = document.createElement('div');
                row.className = 'search-result-item';
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
                section.appendChild(row);
            });
            results.appendChild(section);
        }

        if (probMatches.length > 0) {
            const section = document.createElement('div');
            section.innerHTML = `<p class="search-section-label"><i class="fa-solid fa-wrench"></i> Problemas (${probMatches.length})</p>`;
            probMatches.slice(0, 5).forEach(item => {
                const row = document.createElement('div');
                row.className = 'search-result-item';
                row.innerHTML = `
                    <div>
                        <span class="search-result-title">${highlight(item.title, query)}</span>
                        ${item.description ? `<span class="search-result-desc">${highlight(item.description, query)}</span>` : ''}
                    </div>
                    <button class="btn ghost search-goto-btn" title="Ver problema"><i class="fa-solid fa-arrow-right"></i></button>
                `;
                row.onclick = () => {
                    // Navega para aba de problemas e fecha busca
                    document.querySelector('[data-tab="tabProblems"]')?.click();
                    // Preenche a pesquisa de problemas com o título
                    const problemSearch = el('problemSearch');
                    if (problemSearch) {
                        problemSearch.value = item.title;
                        problemSearch.dispatchEvent(new Event('input'));
                    }
                    closeSearch();
                };
                section.appendChild(row);
            });
            results.appendChild(section);
        }

    } catch (err) {
        console.error("Erro na busca global:", err);
        results.innerHTML = '<p class="search-hint">Erro ao buscar.</p>';
    }
}

function normalizeSolutions(item) {
    if (item.solutions && Array.isArray(item.solutions)) return item.solutions;
    if (item.solution) return [{ label: 'Solução 1', text: item.solution }];
    return [];
}

function highlight(text, query) {
    if (!text) return '';
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}
