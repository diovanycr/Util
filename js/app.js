import { initAuth } from './auth.js';
import { initAdmin } from './admin.js';
import { initMessages } from './messages.js';
import { closeModal } from './modal.js';

// Inicializa o sistema de autenticação assim que a página carregar
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initAdmin();
    // initMessages é chamado dentro do auth.js quando o login é confirmado
    
    // Configura o botão de fechar do modal se ele existir
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.onclick = closeModal;
    }
});
