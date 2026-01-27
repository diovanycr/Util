import { initAuth } from './auth.js';
import { initModalListeners } from './modal.js';
import { initAdminActions } from './admin.js';

document.addEventListener('DOMContentLoaded', () => {
  initModalListeners();
  initAuth();
  initAdminActions();
});
