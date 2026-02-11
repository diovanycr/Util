/**
 * enhancements.js — Melhorias: busca global, contadores, atalhos
 */

import { el } from './firebase.js';
import { showToast } from './toast.js';

let counts = { msg: 0, problem: 0, link: 0 };

export function initEnhancements() {
    setupGlobalSearch();
    setupNumericShortcuts();
    setupCounterListeners();
}

// --- CONTADORES ---

function setupCounterListeners() {
    document.addEventListener('updateMsgCount', (e) => {
        counts.msg = e.detail;
        updateBadge('msgCount', counts.msg);
    });
    
    document.addEventListener('updateProblemCount', (e) => {
        counts.problem = e.detail;
        updateBadge('problemCount', counts.problem);
    });
    
    document.addEventListener('updateLinkCount', (e) => {
        counts.link = e.detail;
        updateBadge('linkCount', counts.link);
    });
}

function updateBadge(id, count) {
    const badge = el(id);
    if (badge) badge.textContent = count;
}

// --- BUSCA GLOBAL ---

function setupGlobalSearch() {
    const input = el('globalSearch');
    const clearBtn = el('btnClearGlobalSearch');
    
    if (!input || !clearBtn) return;

    input.oninput = () => {
        const query = input.value.trim().toLowerCase();
        clearBtn.classList.toggle('hidden', !query);
        applyGlobalSearch(query);
    };

    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            copyFirstResult();
        }
    };

    clearBtn.onclick = () => {
        input.value = '';
        clearBtn.classList.add('hidden');
        applyGlobalSearch('');
        input.focus();
    };

    // Ctrl+F
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            input.focus();
            input.select();
        }
    });
}

function applyGlobalSearch(query) {
    // Filtra mensagens
    const msgRows = document.querySelectorAll('#msgList .user-row');
    msgRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = !query || text.includes(query) ? '' : 'none';
    });
    
    // Oculta grupos de mensagens vazios
    document.querySelectorAll('#msgList .msg-group').forEach(group => {
        const hasVisible = [...group.querySelectorAll('.user-row')].some(r => r.style.display !== 'none');
        group.style.display = hasVisible ? '' : 'none';
    });

    // Filtra problemas
    const problemCards = document.querySelectorAll('#problemList .problem-card');
    problemCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = !query || text.includes(query) ? '' : 'none';
    });

    // Filtra links
    const linkCards = document.querySelectorAll('#linkList .link-card');
    linkCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = !query || text.includes(query) ? '' : 'none';
    });
    
    // Oculta grupos de links vazios
    document.querySelectorAll('#linkList .link-group').forEach(group => {
        const hasVisible = [...group.querySelectorAll('.link-card')].some(c => c.style.display !== 'none');
        group.style.display = hasVisible ? '' : 'none';
    });
}

function copyFirstResult() {
    const activeTab = document.querySelector('.tab.active')?.dataset.tab;
    
    if (activeTab === 'tabMessages') {
        const firstMsg = [...document.querySelectorAll('#msgList .user-row')]
            .find(r => r.style.display !== 'none');
        if (firstMsg) {
            const textEl = firstMsg.querySelector('.msg-text');
            if (textEl) {
                navigator.clipboard.writeText(textEl.textContent.trim());
                showToast('Primeira mensagem copiada!');
            }
        }
    } else if (activeTab === 'tabProblems') {
        const firstProblem = [...document.querySelectorAll('#problemList .problem-card')]
            .find(c => c.style.display !== 'none');
        if (firstProblem) {
            const copyField = firstProblem.querySelector('.solution-copy-field');
            if (copyField) copyField.click();
        }
    } else if (activeTab === 'tabLinks') {
        const firstLink = [...document.querySelectorAll('#linkList .link-card')]
            .find(c => c.style.display !== 'none');
        if (firstLink) {
            const link = firstLink.querySelector('.link-main');
            if (link?.href) {
                window.open(link.href, '_blank');
                showToast('Link aberto!');
            }
        }
    }
}

// --- ATALHOS NUMÉRICOS ---

function setupNumericShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignora se está digitando
        if (e.target.matches('input, textarea, [contenteditable="true"]')) return;

        const tabMap = {
            '1': 'tabMessages',
            '2': 'tabProblems',
            '3': 'tabLinks'
        };

        if (tabMap[e.key]) {
            e.preventDefault();
            const btn = document.querySelector(`button[data-tab="${tabMap[e.key]}"]`);
            if (btn) btn.click();
        }
    });
}
