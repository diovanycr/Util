import { initAuth } from './auth.js';
import { initModalListeners } from './modal.js';
import { initAdminActions } from './admin.js';
import { initTabs } from './tabs.js';

document.addEventListener('DOMContentLoaded', () => {
    initModalListeners();
    initAuth();
    initAdminActions();
    initTabs();
});
