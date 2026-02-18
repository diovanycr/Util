/**
 * shortcuts.js — Atalhos de teclado globais
 *
 * N     ? Nova mensagem (aba Mensagens ativa)
 * P     ? Novo problema (aba Problemas ativa)
 * Esc   ? Fecha formulários abertos
 * Ctrl+K ? Abre busca global
 * ? ?   ? Navega resultados da busca global
 * Enter ? Aciona resultado selecionado
 */
import { el } from './firebase.js';

let _searchIndex = -1; // índice do item selecionado na busca

export function initShortcuts() {
    const btnSearch = document.getElementById('btnSearch');
    if (btnSearch) btnSearch.addEventListener('click', openSearch);

    document.addEventListener('keydown', (e) => {
        const tag = document.activeElement.tagName;
        const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' ||
            document.activeElement.isContentEditable;

        // Ctrl+K — busca global (funciona sempre)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openSearch();
            return;
        }

        // Navegação dentro do modal de busca
        const searchModal = el('globalSearchModal');
        const modalOpen = searchModal && !searchModal.classList.contains('hidden');

        if (modalOpen) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                _navigateResults(1);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                _navigateResults(-1);
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                _activateSelected();
                return;
            }
            if (e.key === 'Escape') {
                closeSearch();
                return;
            }
            return; // não processa outros atalhos com modal aberto
        }

        if (isEditing) return;

        // Esc — fecha formulários abertos
        if (e.key === 'Escape') {
            closeOpenForms();
            return;
        }

        // N — nova mensagem
        if (e.key === 'n' || e.key === 'N') {
            const tabMessages = el('tabMessages');
            if (tabMessages && !tabMessages.classList.contains('hidden')) {
                el('newMsgBox')?.classList.remove('hidden');
                el('msgText')?.focus();
            }
            return;
        }

        // P — novo problema
        if (e.key === 'p' || e.key === 'P') {
            const tabProblems = el('tabProblems');
            if (tabProblems && !tabProblems.classList.contains('hidden')) {
                el('newProblemBox')?.classList.remove('hidden');
                el('problemTitle')?.focus();
            }
            return;
        }

        // 1-4 — navegação entre abas
        if (e.key === '1') { document.querySelector('[data-tab="tabMessages"]')?.click(); return; }
        if (e.key === '2') { document.querySelector('[data-tab="tabProblems"]')?.click(); return; }
        if (e.key === '3') { document.querySelector('[data-tab="tabLinks"]')?.click(); return; }
        if (e.key === '4') { document.querySelector('[data-tab="tabSistemas"]')?.click(); return; }
    });
}

// Navega para cima ou baixo nos resultados
function _navigateResults(dir) {
    const items = document.querySelectorAll('#globalSearchResults .search-result-item');
    if (!items.length) return;

    // Remove seleção atual
    items.forEach(i => i.classList.remove('search-selected'));

    _searchIndex += dir;
    if (_searchIndex < 0) _searchIndex = items.length - 1;
    if (_searchIndex >= items.length) _searchIndex = 0;

    const selected = items[_searchIndex];
    selected.classList.add('search-selected');
    selected.scrollIntoView({ block: 'nearest' });
}

// Aciona o botão principal do item selecionado (copiar ou ir)
function _activateSelected() {
    const selected = document.querySelector('#globalSearchResults .search-result-item.search-selected');
    if (selected) {
        // Tenta clicar no botão de copiar primeiro, senão clica no item
        const copyBtn = selected.querySelector('.search-copy-btn');
        if (copyBtn) copyBtn.click();
        else selected.click();
    } else {
        // Se nenhum selecionado, aciona o primeiro resultado
        const first = document.querySelector('#globalSearchResults .search-result-item');
        if (first) {
            const copyBtn = first.querySelector('.search-copy-btn');
            if (copyBtn) copyBtn.click();
            else first.click();
        }
    }
}

function closeOpenForms() {
    const msgBox = el('newMsgBox');
    if (msgBox && !msgBox.classList.contains('hidden')) { el('btnCancelMsg')?.click(); return; }

    const problemBox = el('newProblemBox');
    if (problemBox && !problemBox.classList.contains('hidden')) { el('btnCancelProblem')?.click(); return; }

    const trashBox = el('trashBox');
    if (trashBox && !trashBox.classList.contains('hidden')) { el('btnCancelTrash')?.click(); return; }

    const searchModal = el('globalSearchModal');
    if (searchModal && !searchModal.classList.contains('hidden')) { closeSearch(); return; }
}

// --- BUSCA GLOBAL (Ctrl+K) ---
export function openSearch() {
    const modal = el('globalSearchModal');
    if (!modal) return;
    _searchIndex = -1; // reseta índice ao abrir
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    const input = el('globalSearchInput');
    if (input) { input.value = ''; input.focus(); }
    el('globalSearchResults').innerHTML = '<p class="search-hint">Digite para buscar...</p>';

    // Reseta seleção quando o usuário digita
    input?.addEventListener('input', () => { _searchIndex = -1; }, { once: false });
}

export function closeSearch() {
    const modal = el('globalSearchModal');
    if (!modal) return;
    _searchIndex = -1;
    modal.classList.add('hidden');
    modal.style.display = 'none';
}
