/**
 * help.js — Modal de ajuda
 * Atalhos de teclado, tutorial de uso, informações de contato/suporte
 */

import { el } from '../core/firebase.js';
import { openModalContainer, closeModalContainer } from '../core/modal.js';

export function initHelp() {
    const btn = document.getElementById('btnHelp');
    const modal = document.getElementById('helpModal');
    const btnClose = document.getElementById('btnCloseHelp');
    const tabs = document.querySelectorAll('.help-tab');
    const panels = document.querySelectorAll('.help-panel');

    if (!btn || !modal) return;

    btn.addEventListener('click', () => {
        openModalContainer(modal, btnClose);
        // Ativa primeira aba por padrão
        switchHelpTab('shortcuts');
    });

    btnClose?.addEventListener('click', closeHelp);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeHelp(); });

    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('hidden') && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
            const activeTab = /** @type {HTMLElement|null} */ (document.querySelector('.help-tab.active'));
            if (!activeTab) return;
            const tabList = /** @type {HTMLElement[]} */ ([...tabs]);
            const idx = tabList.indexOf(activeTab);
            if (idx < 0) return;
            e.preventDefault();
            const nextIdx = e.key === 'ArrowRight'
                ? (idx + 1) % tabList.length
                : (idx - 1 + tabList.length) % tabList.length;
            const nextTab = tabList[nextIdx];
            if (nextTab?.dataset?.panel) switchHelpTab(nextTab.dataset.panel);
            nextTab?.focus();
        }
    });

    function closeHelp() {
        closeModalContainer(modal);
    }

    tabs.forEach(tab => {
        const hTab = /** @type {HTMLElement} */ (tab);
        hTab.addEventListener('click', () => { if (hTab.dataset.panel) switchHelpTab(hTab.dataset.panel); });
        hTab.addEventListener('keydown', (e) => {
            const tabList = /** @type {HTMLElement[]} */ ([...tabs]);
            if (e.key === 'Home') {
                e.preventDefault();
                tabList[0]?.focus();
                if (tabList[0]?.dataset?.panel) switchHelpTab(tabList[0].dataset.panel);
            } else if (e.key === 'End') {
                e.preventDefault();
                const last = tabList[tabList.length - 1];
                last?.focus();
                if (last?.dataset?.panel) switchHelpTab(last.dataset.panel);
            }
        });
    });
}

function switchHelpTab(panelId) {
    document.querySelectorAll('.help-tab').forEach(t => {
        const hTab = /** @type {HTMLElement} */ (t);
        const active = hTab.dataset.panel === panelId;
        hTab.classList.toggle('active', active);
        hTab.setAttribute('aria-selected', active ? 'true' : 'false');
        hTab.setAttribute('tabindex', active ? '0' : '-1');
    });
    document.querySelectorAll('.help-panel').forEach(p => {
        p.classList.toggle('hidden', p.id !== `help-${panelId}`);
    });
}
