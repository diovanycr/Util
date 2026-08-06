import { initAuth } from './auth.js';
import { initModalListeners } from './modal.js';
import { initAdminActions } from './admin.js';
import { initTabs } from './tabs.js';
import { initTheme } from './theme.js';
import { initHelp } from './help.js';
import { initShortcuts } from './shortcuts.js';
import { showModal } from './modal.js';

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
        import('./portOpener.js').then(({ renderSistemasTab }) => {
            const tabSistemas = document.getElementById('tabSistemas');
            if (tabSistemas) renderSistemasTab(tabSistemas);
        });
    }, { once: true });
});
