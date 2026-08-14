import { initAuth } from './modules/auth.js';
import { initModalListeners } from './core/modal.js';
import { initAdminActions } from './modules/admin.js';
import { initTabs } from './core/tabs.js';
import { initTheme } from './core/theme.js';
import { initHelp } from './modules/help.js';
import { initShortcuts } from './core/shortcuts.js';
import { showModal } from './core/modal.js';

let sistemasInitialized = false;

function showErrorToast(message) {
    showModal(`Ocorreu um erro inesperado: ${message}. Tente recarregar a página.`);
}

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showErrorToast(event.message);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled rejection:', event.reason);
    const message = event.reason?.message || event.reason || 'Erro desconhecido';
    showErrorToast(message);
});

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
        import('./tools/portOpener.js').then(({ renderSistemasTab }) => {
            const tabSistemas = document.getElementById('tabSistemas');
            if (tabSistemas) renderSistemasTab(tabSistemas);
        });
    }, { once: true });
});
