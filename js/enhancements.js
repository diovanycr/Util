/**
 * enhancements.js — Melhorias: busca global, contadores, atalhos
 */

import { el } from './firebase.js';
import { showToast } from './toast.js';

let counts = { msg: 0, problem: 0, link: 0 };

export function initEnhancements() {
    console.log('🚀 initEnhancements chamado');
    setupGlobalSearch();
    setupNumericShortcuts();
    setupCounterListeners();
}

// --- CONTADORES ---

function setupCounterListeners() {
    console.log('📊 Configurando listeners de contadores');
    
    document.addEventListener('updateMsgCount', (e) => {
        console.log('📨 updateMsgCount:', e.detail);
        counts.msg = e.detail;
        updateBadge('msgCount', counts.msg);
    });
    
    document.addEventListener('updateProblemCount', (e) => {
        console.log('🔧 updateProblemCount:', e.detail);
        counts.problem = e.detail;
        updateBadge('problemCount', counts.problem);
    });
    
    document.addEventListener('updateLinkCount', (e) => {
        console.log('🔗 updateLinkCount:', e.detail);
        counts.link = e.detail;
        updateBadge('linkCount', counts.link);
    });
}

function updateBadge(id, count) {
    const badge = el(id);
    console.log(`🏷️ Atualizando badge ${id} com ${count}`);
    if (badge) {
        badge.textContent = count;
    } else {
        console.error(`❌ Badge ${id} não encontrado`);
    }
}

// --- BUSCA GLOBAL ---

function setupGlobalSearch() {
    console.log('🔍 Configurando busca global');
    const input = el('globalSearch');
    const clearBtn = el('btnClearGlobalSearch');
    
    if (!input) {
        console.error('❌ globalSearch input não encontrado');
        return;
    }
    if (!clearBtn) {
        console.error('❌ btnClearGlobalSearch não encontrado');
        return;
    }

    console.log('✅ Elementos de busca encontrados');

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
            console.log('⌨️ Ctrl+F pressionado');
            input.focus();
            input.select();
        }
    });
}

function applyGlobalSearch(query) {
    console.log('🔎 Aplicando busca global:', query);
    
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
        console.log(`📊 Resultados: ${msgVisible} msgs, ${problemVisible} problemas, ${linkVisible} links`);
    } else {
        // Restaura contadores originais
        updateBadge('msgCount', counts.msg);
        updateBadge('problemCount', counts.problem);
        updateBadge('linkCount', counts.link);
    }
}

function copyFirstResult() {
    console.log('📋 Copiando primeiro resultado');
    const activeTab = document.querySelector('.tab.active')?.dataset.tab;
    console.log('Aba ativa:', activeTab);
    
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
    console.log('⌨️ Configurando atalhos numéricos');
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
            console.log(`⌨️ Tecla ${e.key} pressionada - mudando para ${tabMap[e.key]}`);
            const btn = document.querySelector(`button[data-tab="${tabMap[e.key]}"]`);
            if (btn) {
                btn.click();
            } else {
                console.error(`❌ Botão para ${tabMap[e.key]} não encontrado`);
            }
        }
    });
}
