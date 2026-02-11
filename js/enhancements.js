/**
 * enhancements.js — Melhorias: busca global, contadores, modo compacto, favoritos, atalhos
 */

import { el } from './firebase.js';
import { showToast } from './toast.js';

let counts = { msg: 0, problem: 0, link: 0 };
let compactMode = false;
let favorites = new Set();

export function initEnhancements() {
    setupGlobalSearch();
    setupNumericShortcuts();
    setupCounterListeners();
    setupCompactMode();
    setupFavorites();
    loadFavoritesFromStorage();
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
    let msgVisible = 0, problemVisible = 0, linkVisible = 0;
    
    // Filtra mensagens
    const msgRows = document.querySelectorAll('#msgList .user-row');
    msgRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const visible = !query || text.includes(query);
        row.style.display = visible ? '' : 'none';
        if (visible) msgVisible++;
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
        const visible = !query || text.includes(query);
        card.style.display = visible ? '' : 'none';
        if (visible) problemVisible++;
    });

    // Filtra links
    const linkCards = document.querySelectorAll('#linkList .link-card');
    linkCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const visible = !query || text.includes(query);
        card.style.display = visible ? '' : 'none';
        if (visible) linkVisible++;
    });
    
    // Oculta grupos de links vazios
    document.querySelectorAll('#linkList .link-group').forEach(group => {
        const hasVisible = [...group.querySelectorAll('.link-card')].some(c => c.style.display !== 'none');
        group.style.display = hasVisible ? '' : 'none';
    });
    
    // Atualiza badges com contador de resultados
    if (query) {
        updateBadge('msgCount', msgVisible);
        updateBadge('problemCount', problemVisible);
        updateBadge('linkCount', linkVisible);
    } else {
        updateBadge('msgCount', counts.msg);
        updateBadge('problemCount', counts.problem);
        updateBadge('linkCount', counts.link);
    }
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

// --- MODO COMPACTO ---

function setupCompactMode() {
    const btn = el('btnCompactMode');
    if (!btn) return;

    // Carrega estado do localStorage
    const savedMode = localStorage.getItem('compactMode') === 'true';
    if (savedMode) {
        compactMode = true;
        document.body.classList.add('compact-mode');
        btn.querySelector('i').className = 'fa-solid fa-expand';
        btn.title = 'Modo normal';
    }

    btn.onclick = () => {
        compactMode = !compactMode;
        document.body.classList.toggle('compact-mode', compactMode);
        
        const icon = btn.querySelector('i');
        if (compactMode) {
            icon.className = 'fa-solid fa-expand';
            btn.title = 'Modo normal';
            showToast('Modo compacto ativado');
        } else {
            icon.className = 'fa-solid fa-compress';
            btn.title = 'Modo compacto';
            showToast('Modo normal ativado');
        }
        
        localStorage.setItem('compactMode', compactMode);
    };
}

// --- FAVORITOS ---

function setupFavorites() {
    // Escuta eventos de renderização para adicionar estrelas
    document.addEventListener('itemsRendered', addFavoriteStars);
}

function addFavoriteStars() {
    // Adiciona estrelas nas mensagens
    document.querySelectorAll('#msgList .user-row').forEach(row => {
        if (row.querySelector('.btn-favorite')) return; // Já tem estrela
        const id = row.dataset.id;
        if (!id) return;
        
        const star = document.createElement('button');
        star.className = `btn ghost btn-favorite ${isFavorite(id) ? 'active' : ''}`;
        star.innerHTML = '<i class="fa-solid fa-star"></i>';
        star.title = 'Favoritar';
        star.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(id);
            star.classList.toggle('active');
            showToast(isFavorite(id) ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
        };
        
        // Insere antes do botão editar
        const editBtn = row.querySelector('.btn-edit');
        if (editBtn) editBtn.before(star);
    });

    // Adiciona estrelas nos problemas
    document.querySelectorAll('#problemList .problem-card').forEach(card => {
        if (card.querySelector('.btn-favorite')) return;
        const id = card.dataset.id;
        if (!id) return;
        
        const star = document.createElement('button');
        star.className = `btn ghost btn-favorite ${isFavorite(id) ? 'active' : ''}`;
        star.innerHTML = '<i class="fa-solid fa-star"></i>';
        star.title = 'Favoritar';
        star.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(id);
            star.classList.toggle('active');
            showToast(isFavorite(id) ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
        };
        
        const actions = card.querySelector('.problem-actions');
        if (actions) actions.prepend(star);
    });

    // Adiciona estrelas nos links
    document.querySelectorAll('#linkList .link-card').forEach(card => {
        if (card.querySelector('.btn-favorite')) return;
        const id = card.dataset.id;
        if (!id) return;
        
        const star = document.createElement('button');
        star.className = `btn ghost btn-favorite ${isFavorite(id) ? 'active' : ''}`;
        star.innerHTML = '<i class="fa-solid fa-star"></i>';
        star.title = 'Favoritar';
        star.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(id);
            star.classList.toggle('active');
            showToast(isFavorite(id) ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
        };
        
        const editBtn = card.querySelector('.link-edit-btn');
        if (editBtn) editBtn.before(star);
    });
}

function loadFavoritesFromStorage() {
    const stored = localStorage.getItem('favorites');
    if (stored) favorites = new Set(JSON.parse(stored));
}

function saveFavoritesToStorage() {
    localStorage.setItem('favorites', JSON.stringify([...favorites]));
}

function toggleFavorite(id) {
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    saveFavoritesToStorage();
}

function isFavorite(id) {
    return favorites.has(id);
}

// --- ATALHOS NUMÉRICOS ---

function setupNumericShortcuts() {
    document.addEventListener('keydown', (e) => {
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
