import { initAuth } from './auth.js';
import { initModalListeners } from './modal.js';
import { initAdminActions } from './admin.js';
import { initTabs } from './tabs.js';

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa os escutadores de fechar/confirmar modal
    initModalListeners();

    // Inicializa a lógica de login e monitoramento de sessão
    initAuth();

    // Inicializa o clique do botão "Criar Usuário"
    initAdminActions();

    // Inicializa o sistema de abas
    initTabs();
});

// Exemplo de como alternar as telas no login de sucesso
function onLoginSuccess() {
    document.getElementById('loginWrapper').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
}
