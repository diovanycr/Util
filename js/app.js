import { initAuth } from './auth.js';
import { initModalListeners } from './modal.js';
import { initAdminActions } from './admin.js';
import { initTabs } from './tabs.js';
import { initTheme } from './theme.js';
import { initHelp } from './help.js';
import { initShortcuts } from './shortcuts.js';

let sistemasInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initShortcuts();
    initModalListeners();
    initAuth();
    initAdminActions();
    initTabs();
    initHelp();

    document.querySelector('[data-tab="tabSistemas"]')?.addEventListener('click', () => {
        if (sistemasInitialized) return;
        sistemasInitialized = true;
        import('./portOpener.js').then(({ renderSistemasTab }) => {
            const tabSistemas = document.getElementById('tabSistemas');
            if (tabSistemas) renderSistemasTab(tabSistemas);
        });
    }, { once: true });
});
