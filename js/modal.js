import { el } from './firebase.js';

export function showModal(message) {
  const modal = el('modalOverlay');
  const msg = el('modalMessage');
  
  if (modal && msg) {
    msg.innerText = message;
    // Remove a classe e força o display flex
    modal.classList.remove('hidden');
    modal.style.display = 'flex'; 
  } else {
    // Se o elemento não existir, o alerta do navegador avisa
    alert(message);
    console.error("Erro: Elementos do modal não encontrados no HTML.");
  }
}

export function closeModal() {
  const modal = el('modalOverlay');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

// Torna o fechar acessível pelo botão HTML (onclick)
window.closeModal = closeModal;
