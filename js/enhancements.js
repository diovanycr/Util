/**
 * enhancements.js — Melhorias: busca global, contadores, favoritos, modo compacto, atalhos
 */

import { el } from './firebase.js';
import { showToast } from './toast.js';

let globalSearchActive = false;
let compactMode = false;
let favorites = new Set(); // IDs de itens favoritados

// --- INIT ---

export function initEnhancements() {
    setupGlobalSearch();
    setupCompactMode();
    setupFavorites();
    setupNumericShortcuts();
    loadFavoritesFromStorage();
}

// --- BUSCA GLOBAL (Ctrl+F) ---

function setupGlobalSearch() {
    const input = el('globalSearch');
    const clearBtn = el('btnClearGlobalSearch');

    input.oninput = () => {
        const query = input.value.trim().toLowerCase();
        clearBtn.classList.toggle('hidden', !query);
        applyGlobalSearch(query);
    };

    // Enter copia o primeiro resultado visível
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

    // Ctrl+F foca na busca global
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            input.focus();
            input.select();
        }
    });
}

function applyGlobalSearch(query) {
    globalSearchActive = !!query;

    // Filtra em todas as abas
    filterMessages(query);
    filterProblems(query);
    filterLinks(query);
}

function filterMessages(query) {
    const rows = document.querySelectorAll('#msgList .user-row');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = !query || text.includes(query) ? '' : 'none';
    });
    // Oculta grupos vazios
    document.querySelectorAll('#msgList .msg-group').forEach(group => {
        const visible = [...group.querySelectorAll('.user-row')].some(r => r.style.display !== 'none');
        group.style.display = visible ? '' : 'none';
    });
}

function filterProblems(query) {
    const cards = document.querySelectorAll('#problemList .problem-card');
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = !query || text.includes(query) ? '' : 'none';
    });
}

function filterLinks(query) {
    const cards = document.querySelectorAll('#linkList .link-card');
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = !query || text.includes(query) ? '' : 'none';
    });
    // Oculta grupos vazios
    document.querySelectorAll('#linkList .link-group').forEach(group => {
        const visible = [...group.querySelectorAll('.link-card')].some(c => c.style.display !== 'none');
        group.style.display = visible ? '' : 'none';
    });
}

function copyFirstResult() {
    const activeTab = document.querySelector('.tab.active')?.dataset.tab;
    
    if (activeTab === 'tabMessages') {
        const firstMsg = [...document.querySelectorAll('#msgList .user-row')]
            .find(r => r.style.display !== 'none');
        if (firstMsg) {
            const text = firstMsg.querySelector('.msg-text')?.textContent.trim();
            if (text) {
                navigator.clipboard.writeText(text);
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
            const url = firstLink.querySelector('.link-main')?.href;
            if (url) window.open(url, '_blank');
        }
    }
}

// --- CONTADORES NAS ABAS ---

export function updateTabCounts(msgCount = 0, problemCount = 0, linkCount = 0) {
    const msgBadge = el('msgCount');
    const probBadge = el('problemCount');
    const linkBadge = el('linkCount');

    if (msgBadge) msgBadge.textContent = msgCount;
    if (probBadge) probBadge.textContent = problemCount;
    if (linkBadge) linkBadge.textContent = linkCount;
}

// --- MODO COMPACTO (não implementado visualmente ainda, placeholder) ---

function setupCompactMode() {
    // Placeholder para modo compacto — pode adicionar botão no header depois
    // compactMode toggle reduziria padding dos cards, font-size, etc
}

// --- FAVORITOS (estrela nos cards) ---

function setupFavorites() {
    // Adiciona estrelas dinamicamente aos cards quando renderizados
    // Será chamado via MutationObserver ou diretamente nas funções de render
}

function loadFavoritesFromStorage() {
    const stored = localStorage.getItem('favorites');
    if (stored) favorites = new Set(JSON.parse(stored));
}

function saveFavoritesToStorage() {
    localStorage.setItem('favorites', JSON.stringify([...favorites]));
}

export function toggleFavorite(id) {
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    saveFavoritesToStorage();
    return favorites.has(id);
}

export function isFavorite(id) {
    return favorites.has(id);
}

// --- ATALHOS NUMÉRICOS (1-5 para alternar abas) ---

function setupNumericShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignora se está digitando em input/textarea
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
