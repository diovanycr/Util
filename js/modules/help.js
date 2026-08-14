/**
 * help.js — Modal de ajuda
 * Atalhos de teclado, tutorial de uso, informações de contato/suporte
 */

import { el } from '../core/firebase.js';

export function initHelp() {
    const btn = document.getElementById('btnHelp');
    const modal = document.getElementById('helpModal');
    const btnClose = document.getElementById('btnCloseHelp');
    const tabs = document.querySelectorAll('.help-tab');
    const panels = document.querySelectorAll('.help-panel');

    if (!btn || !modal) return;

    let _helpPreviousFocus = null;

    btn.addEventListener('click', () => {
        _helpPreviousFocus = document.activeElement;
        modal.classList.remove('hidden');
        // Ativa primeira aba por padrão
        switchHelpTab('shortcuts');
        btnClose?.focus();
    });

    btnClose?.addEventListener('click', closeHelp);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeHelp(); });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeHelp();
        if (!modal.classList.contains('hidden') && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
            const activeTab = document.querySelector('.help-tab.active');
            if (!activeTab) return;
            const tabList = [...tabs];
            const idx = tabList.indexOf(activeTab);
            if (idx < 0) return;
            e.preventDefault();
            const nextIdx = e.key === 'ArrowRight'
                ? (idx + 1) % tabList.length
                : (idx - 1 + tabList.length) % tabList.length;
            const nextTab = tabList[nextIdx];
            switchHelpTab(nextTab.dataset.panel);
            nextTab.focus();
        }
    });

    function closeHelp() {
        document.getElementById('helpModal')?.classList.add('hidden');
        if (_helpPreviousFocus) { _helpPreviousFocus.focus(); _helpPreviousFocus = null; }
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchHelpTab(tab.dataset.panel));
        tab.addEventListener('keydown', (e) => {
            if (e.key === 'Home') {
                e.preventDefault();
                tabs[0]?.focus();
                switchHelpTab(tabs[0].dataset.panel);
            } else if (e.key === 'End') {
                e.preventDefault();
                const last = tabs[tabs.length - 1];
                last?.focus();
                switchHelpTab(last.dataset.panel);
            }
        });
    });
}

function switchHelpTab(panelId) {
    document.querySelectorAll('.help-tab').forEach(t => {
        const active = t.dataset.panel === panelId;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
        t.setAttribute('tabindex', active ? '0' : '-1');
    });
    document.querySelectorAll('.help-panel').forEach(p => {
        p.classList.toggle('hidden', p.id !== `help-${panelId}`);
    });
}
