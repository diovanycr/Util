import { initAuth } from './auth.js';
import { initModalListeners } from './modal.js';
import { initAdminActions } from './admin.js';
import { initTabs } from './tabs.js';
import { initTheme } from './theme.js';
import { initHelp } from './help.js';
import { initShortcuts } from './shortcuts.js';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initShortcuts();
    initModalListeners();
    initAuth();
    initAdminActions();
    initTabs();
    initHelp();
});
