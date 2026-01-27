import { initAuth } from './auth.js';
import { initModalListeners } from './modal.js';
import { initAdminActions } from './admin.js';

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa os escutadores de fechar/confirmar modal
    initModalListeners();
    
    // Inicializa a lógica de login e monitoramento de sessão
    initAuth();
    
    // Inicializa o clique do botão "Criar Usuário"
    initAdminActions();
});
