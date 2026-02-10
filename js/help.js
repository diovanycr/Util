/**
 * help.js — Modal de ajuda
 * Atalhos de teclado, tutorial de uso, informações de contato/suporte
 */

import { el } from './firebase.js';

export function initHelp() {
    const btn = document.getElementById('btnHelp');
    const modal = document.getElementById('helpModal');
    const btnClose = document.getElementById('btnCloseHelp');
    const tabs = document.querySelectorAll('.help-tab');
    const panels = document.querySelectorAll('.help-panel');

    if (!btn || !modal) return;

    btn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        // Ativa primeira aba por padrão
        switchHelpTab('shortcuts');
    });

    btnClose?.addEventListener('click', closeHelp);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeHelp(); });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeHelp();
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchHelpTab(tab.dataset.panel));
    });
}

function closeHelp() {
    document.getElementById('helpModal')?.classList.add('hidden');
}

function switchHelpTab(panelId) {
    document.querySelectorAll('.help-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.panel === panelId);
    });
    document.querySelectorAll('.help-panel').forEach(p => {
        p.classList.toggle('hidden', p.id !== `help-${panelId}`);
    });
}
