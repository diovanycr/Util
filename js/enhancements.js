/**
 * enhancements.js — Melhorias: busca global, contadores, modo compacto, favoritos, atalhos
 */

import { el } from './firebase.js';
import { showToast } from './toast.js';

let counts = { msg: 0, problem: 0, link: 0 };
let compactMode = false;
let favorites = new Set();
let filteringFavorites = { msg: false, problem: false, link: false };
let currentUserId = null;

export function initEnhancements(uid) {
    currentUserId = uid;
    setupGlobalSearch();
    setupNumericShortcuts();
    setupCounterListeners();
    setupCompactMode();
    setupFavorites();
    setupFavoriteFilters();
    loadFavoritesFromStorage();
}

export function resetEnhancements() {
    currentUserId = null;
    favorites = new Set();
    filteringFavorites = { msg: false, problem: false, link: false };
    if (compactMode) {
        compactMode = false;
        document.body.classList.remove('compact-mode');
    }
}

// --- CONTADORES ---

function setupCounterListeners() {
    document.addEventListener('updateMsgCount', (e) => {
        counts.msg = e.detail;
        if (!filteringFavorites.msg) updateBadge('msgCount', counts.msg);
    });
    
    document.addEventListener('updateProblemCount', (e) => {
        counts.problem = e.detail;
        if (!filteringFavorites.problem) updateBadge('problemCount', counts.problem);
    });
    
    document.addEventListener('updateLinkCount', (e) => {
        counts.link = e.detail;
        if (!filteringFavorites.link) updateBadge('linkCount', counts.link);
    });
}

function updateBadge(id, count) {
    const badge = el(id);
    if (badge) {
        badge.textContent = count;
        if (count === 0 || count === '0' || !count) {
            badge.style.display = 'none';
        } else {
            badge.style.display = 'inline-flex';
        }
    }
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
        } else if (e.key === 'Escape') {
            e.preventDefault();
            input.value = '';
            clearBtn.classList.add('hidden');
            applyGlobalSearch('');
            input.blur();
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
        row.classList.toggle('hidden-by-search', !visible);
        if (visible) msgVisible++;
    });
    
    document.querySelectorAll('#msgList .msg-group').forEach(group => {
        const hasVisible = [...group.querySelectorAll('.user-row')].some(r => !r.classList.contains('hidden-by-search') && !r.classList.contains('hidden-by-filter'));
        group.classList.toggle('hidden-by-search', !hasVisible);
    });

    // Filtra problemas
    const problemCards = document.querySelectorAll('#problemList .problem-card');
    problemCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const visible = !query || text.includes(query);
        card.classList.toggle('hidden-by-search', !visible);
        if (visible) problemVisible++;
    });

    // Filtra links
    const linkCards = document.querySelectorAll('#linkList .link-card');
    linkCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const visible = !query || text.includes(query);
        card.classList.toggle('hidden-by-search', !visible);
        if (visible) linkVisible++;
    });
    
    document.querySelectorAll('#linkList .link-group').forEach(group => {
        const hasVisible = [...group.querySelectorAll('.link-card')].some(c => !c.classList.contains('hidden-by-search') && !c.classList.contains('hidden-by-filter'));
        group.classList.toggle('hidden-by-search', !hasVisible);
    });
    
    // Atualiza badges
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

/** Considera hidden-by-search / hidden-by-filter / .hidden, não só style.display */
function isDomVisible(node) {
    if (!node) return false;
    if (node.classList.contains('hidden-by-search')) return false;
    if (node.classList.contains('hidden-by-filter')) return false;
    if (node.classList.contains('hidden')) return false;
    if (node.style.display === 'none') return false;
    return true;
}

function copyFirstResult() {
    const activeTab = document.querySelector('.tab.active')?.dataset.tab;
    
    if (activeTab === 'tabMessages') {
        const firstMsg = [...document.querySelectorAll('#msgList .user-row')]
            .find(isDomVisible);
        if (firstMsg) {
            const textEl = firstMsg.querySelector('.msg-text');
            if (textEl) {
                navigator.clipboard.writeText(textEl.textContent.trim());
                showToast('Primeira mensagem copiada!');
            }
        }
    } else if (activeTab === 'tabProblems') {
        const firstProblem = [...document.querySelectorAll('#problemList .problem-card')]
            .find(isDomVisible);
        if (firstProblem) {
            const copyField = firstProblem.querySelector('.solution-copy-field');
            if (copyField) copyField.click();
        }
    } else if (activeTab === 'tabLinks') {
        const firstLink = [...document.querySelectorAll('#linkList .link-card')]
            .find(isDomVisible);
        if (firstLink) {
            const link = firstLink.querySelector('.link-main');
            const href = link?.getAttribute('href');
            if (href) {
                window.open(href, '_blank', 'noopener,noreferrer');
                showToast('Link aberto!');
            } else {
                showToast('Link indisponível.');
            }
        }
    }
}

// --- MODO COMPACTO ---

function setupCompactMode() {
    const btn = el('btnCompactMode');
    if (!btn) return;

    const savedMode = localStorage.getItem('compactMode') === 'true';
    if (savedMode) {
        compactMode = true;
        document.body.classList.add('compact-mode');
        btn.querySelector('i').className = 'fa-solid fa-expand';
        btn.title = 'Modo normal';
        btn.setAttribute('aria-label', 'Desativar modo compacto');
        btn.setAttribute('aria-pressed', 'true');
        btn.classList.add('active');
    } else {
        btn.setAttribute('aria-pressed', 'false');
    }

    btn.onclick = () => {
        compactMode = !compactMode;
        document.body.classList.toggle('compact-mode', compactMode);
        btn.classList.toggle('active', compactMode);
        btn.setAttribute('aria-pressed', compactMode ? 'true' : 'false');
        
        const icon = btn.querySelector('i');
        if (compactMode) {
            icon.className = 'fa-solid fa-expand';
            btn.title = 'Modo normal';
            btn.setAttribute('aria-label', 'Desativar modo compacto');
            showToast('Modo compacto ativado');
        } else {
            icon.className = 'fa-solid fa-compress';
            btn.title = 'Modo compacto';
            btn.setAttribute('aria-label', 'Ativar modo compacto');
            showToast('Modo normal ativado');
        }
        
        localStorage.setItem('compactMode', compactMode);
    };
}

// --- FILTRO DE FAVORITOS ---

function setupFavoriteFilters() {
    // Filtro de mensagens
    const btnMsg = el('btnFilterFavorites');
    if (btnMsg) {
        btnMsg.setAttribute('aria-pressed', 'false');
        btnMsg.onclick = () => {
            filteringFavorites.msg = !filteringFavorites.msg;
            btnMsg.classList.toggle('active', filteringFavorites.msg);
            btnMsg.setAttribute('aria-pressed', filteringFavorites.msg ? 'true' : 'false');
            applyFavoriteFilter('msg', '#msgList .user-row', '#msgList .msg-group');
        };
    }

    // Filtro de problemas
    const btnProb = el('btnFilterFavoriteProblems');
    if (btnProb) {
        btnProb.setAttribute('aria-pressed', 'false');
        btnProb.onclick = () => {
            filteringFavorites.problem = !filteringFavorites.problem;
            btnProb.classList.toggle('active', filteringFavorites.problem);
            btnProb.setAttribute('aria-pressed', filteringFavorites.problem ? 'true' : 'false');
            applyFavoriteFilter('problem', '#problemList .problem-card');
        };
    }

    // Filtro de links
    const btnLink = el('btnFilterFavoriteLinks');
    if (btnLink) {
        btnLink.setAttribute('aria-pressed', 'false');
        btnLink.onclick = () => {
            filteringFavorites.link = !filteringFavorites.link;
            btnLink.classList.toggle('active', filteringFavorites.link);
            btnLink.setAttribute('aria-pressed', filteringFavorites.link ? 'true' : 'false');
            applyFavoriteFilter('link', '#linkList .link-card', '#linkList .link-group');
        };
    }
}

function applyFavoriteFilter(type, itemSelector, groupSelector) {
    const filtering = filteringFavorites[type];
    const items = document.querySelectorAll(itemSelector);
    let visibleCount = 0;

    items.forEach(item => {
        const id = item.dataset.id;
        const visible = !filtering || isFavorite(id);
        item.classList.toggle('hidden-by-filter', !visible);
        if (visible) visibleCount++;
    });

    // Oculta grupos vazios se existir
    if (groupSelector) {
        document.querySelectorAll(groupSelector).forEach(group => {
            const hasVisible = [...group.querySelectorAll(itemSelector)].some(i => !i.classList.contains('hidden-by-filter') && !i.classList.contains('hidden-by-search'));
            group.classList.toggle('hidden-by-filter', !hasVisible);
        });
    }

    // Atualiza badge
    const badgeMap = { msg: 'msgCount', problem: 'problemCount', link: 'linkCount' };
    if (filtering) {
        updateBadge(badgeMap[type], visibleCount);
        showToast(`Mostrando ${visibleCount} favorito(s)`);
    } else {
        updateBadge(badgeMap[type], counts[type]);
    }
}

// --- FAVORITOS ---

function setupFavorites() {
    document.addEventListener('itemsRendered', addFavoriteStars);
}

function addFavoriteStars() {
    // helper para atualizar label e pressed ao alternar
    function updateStarA11y(star, fav) {
        const label = fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
        star.setAttribute('aria-label', label);
        star.setAttribute('aria-pressed', fav ? 'true' : 'false');
        star.title = label;
    }

    // Mensagens
    document.querySelectorAll('#msgList .user-row').forEach(row => {
        if (row.querySelector('.btn-favorite')) return;
        const id = row.dataset.id;
        if (!id) return;
        
        const fav = isFavorite(id);
        const star = document.createElement('button');
        star.className = `btn ghost btn-favorite ${fav ? 'active' : ''}`;
        star.innerHTML = '<i class="fa-solid fa-star" aria-hidden="true"></i>';
        updateStarA11y(star, fav);

        star.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(id);
            star.classList.toggle('active');
            updateStarA11y(star, isFavorite(id));
            
            // Reaplica filtro se estiver ativo
            if (filteringFavorites.msg) {
                applyFavoriteFilter('msg', '#msgList .user-row', '#msgList .msg-group');
            }
        };
        
        const editBtn = row.querySelector('.btn-edit');
        if (editBtn) editBtn.before(star);
    });

    // Problemas
    document.querySelectorAll('#problemList .problem-card').forEach(card => {
        if (card.querySelector('.btn-favorite')) return;
        const id = card.dataset.id;
        if (!id) return;
        
        const fav = isFavorite(id);
        const star = document.createElement('button');
        star.className = `btn ghost btn-favorite ${fav ? 'active' : ''}`;
        star.innerHTML = '<i class="fa-solid fa-star" aria-hidden="true"></i>';
        updateStarA11y(star, fav);

        star.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(id);
            star.classList.toggle('active');
            updateStarA11y(star, isFavorite(id));
            
            if (filteringFavorites.problem) {
                applyFavoriteFilter('problem', '#problemList .problem-card');
            }
        };
        
        const actions = card.querySelector('.problem-actions');
        if (actions) actions.prepend(star);
    });

    // Links
    document.querySelectorAll('#linkList .link-card').forEach(card => {
        if (card.querySelector('.btn-favorite')) return;
        const id = card.dataset.id;
        if (!id) return;
        
        const fav = isFavorite(id);
        const star = document.createElement('button');
        star.className = `btn ghost btn-favorite ${fav ? 'active' : ''}`;
        star.innerHTML = '<i class="fa-solid fa-star" aria-hidden="true"></i>';
        updateStarA11y(star, fav);

        star.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(id);
            star.classList.toggle('active');
            updateStarA11y(star, isFavorite(id));
            
            if (filteringFavorites.link) {
                applyFavoriteFilter('link', '#linkList .link-card', '#linkList .link-group');
            }
        };
        
        const editBtn = card.querySelector('.link-edit-btn');
        if (editBtn) editBtn.before(star);
    });
}

function loadFavoritesFromStorage() {
    const key = currentUserId ? `favorites_${currentUserId}` : 'favorites';
    const stored = localStorage.getItem(key);
    if (stored) favorites = new Set(JSON.parse(stored));
    else favorites = new Set();
}

function saveFavoritesToStorage() {
    const key = currentUserId ? `favorites_${currentUserId}` : 'favorites';
    localStorage.setItem(key, JSON.stringify([...favorites]));
}

function toggleFavorite(id) {
    if (favorites.has(id)) {
        favorites.delete(id);
        showToast('Removido dos favoritos');
    } else {
        favorites.add(id);
        showToast('Adicionado aos favoritos');
    }
    saveFavoritesToStorage();
}

function isFavorite(id) {
    return favorites.has(id);
}

// --- ATALHOS NUMÉRICOS (aria apenas — handlers de tecla ficam em shortcuts.js) ---

function setupNumericShortcuts() {
    // Configura aria-keyshortcuts nas abas (navegação 1-4 é tratada só em shortcuts.js)
    document.querySelector('[data-tab="tabMessages"]')?.setAttribute('aria-keyshortcuts', '1 N');
    document.querySelector('[data-tab="tabProblems"]')?.setAttribute('aria-keyshortcuts', '2 P');
    document.querySelector('[data-tab="tabLinks"]')?.setAttribute('aria-keyshortcuts', '3');
    document.querySelector('[data-tab="tabSistemas"]')?.setAttribute('aria-keyshortcuts', '4');
}
