import { initAuth } from './auth.js';
import { initModalListeners } from './modal.js';
import { initAdminActions } from './admin.js'; // Importante!

document.addEventListener('DOMContentLoaded', () => {
    initModalListeners();
    initAuth();
    initAdminActions(); // Isso ativa o botão "Criar Usuário"
});
