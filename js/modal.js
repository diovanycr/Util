import { el } from './firebase.js';

// Variável de controle interna
let modalCallback = null;

export function showModal(message) {
  const modal = el('modalOverlay');
  const msg = el('modalMessage');
  if (modal && msg) {
    msg.innerText = message;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
}

export function closeModal() {
  const modal = el('modalOverlay');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

// ADICIONE O 'export' AQUI:
export function openConfirmModal(cb) {
  modalCallback = cb;
  const confirmModal = el('confirmModal');
  if (confirmModal) {
    confirmModal.classList.remove('hidden');
    confirmModal.style.display = 'flex';
  }
}

export function initModalListeners() {
  // Configura o botão Cancelar do modal de exclusão
  el('modalCancel')?.addEventListener('click', () => {
    modalCallback = null;
    el('confirmModal').classList.add('hidden');
    el('confirmModal').style.display = 'none';
  });

  // Configura o botão Confirmar do modal de exclusão
  el('modalConfirm')?.addEventListener('click', async () => {
    if (modalCallback) await modalCallback();
    modalCallback = null;
    el('confirmModal').classList.add('hidden');
    el('confirmModal').style.display = 'none';
  });
  
  // Torna acessível via HTML onclick
  window.closeModal = closeModal; 
}
