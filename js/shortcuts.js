/**
 * shortcuts.js — Atalhos de teclado globais
 *
 * N   → Nova mensagem (aba Mensagens ativa)
 * P   → Novo problema (aba Problemas ativa)
 * Esc → Fecha formulários abertos
 * Ctrl+K → Abre busca global
 */

import { el } from './firebase.js';

export function initShortcuts() {
    // Botão de busca no header
    const btnSearch = document.getElementById('btnSearch');
    if (btnSearch) btnSearch.addEventListener('click', openSearch);

    document.addEventListener('keydown', (e) => {
        // Ignora se estiver digitando em input/textarea/contenteditable
        const tag = document.activeElement.tagName;
        const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' ||
            document.activeElement.isContentEditable;

        // Ctrl+K — busca global (funciona sempre)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openSearch();
            return;
        }

        if (isEditing) return;

        // Esc — fecha formulários abertos
        if (e.key === 'Escape') {
            closeOpenForms();
            return;
        }

        // N — nova mensagem
        if (e.key === 'n' || e.key === 'N') {
            const msgBox = el('newMsgBox');
            const tabMessages = el('tabMessages');
            if (tabMessages && !tabMessages.classList.contains('hidden')) {
                msgBox?.classList.remove('hidden');
                el('msgText')?.focus();
            }
            return;
        }

        // P — novo problema
        if (e.key === 'p' || e.key === 'P') {
            const problemBox = el('newProblemBox');
            const tabProblems = el('tabProblems');
            if (tabProblems && !tabProblems.classList.contains('hidden')) {
                problemBox?.classList.remove('hidden');
                el('problemTitle')?.focus();
            }
            return;
        }
    });
}

function closeOpenForms() {
    // Fecha formulário de nova mensagem
    const msgBox = el('newMsgBox');
    if (msgBox && !msgBox.classList.contains('hidden')) {
        el('btnCancelMsg')?.click();
        return;
    }
    // Fecha formulário de novo problema
    const problemBox = el('newProblemBox');
    if (problemBox && !problemBox.classList.contains('hidden')) {
        el('btnCancelProblem')?.click();
        return;
    }
    // Fecha lixeira
    const trashBox = el('trashBox');
    if (trashBox && !trashBox.classList.contains('hidden')) {
        el('btnCancelTrash')?.click();
        return;
    }
    // Fecha busca global
    const searchModal = el('globalSearchModal');
    if (searchModal && !searchModal.classList.contains('hidden')) {
        closeSearch();
        return;
    }
}

// --- BUSCA GLOBAL (Ctrl+K) ---

export function openSearch() {
    const modal = el('globalSearchModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    el('globalSearchInput')?.focus();
    el('globalSearchInput').value = '';
    el('globalSearchResults').innerHTML = '';
}

export function closeSearch() {
    const modal = el('globalSearchModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.style.display = 'none';
}
