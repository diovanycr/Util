// js/modal.js

import { el } from './firebase.js';

export function showModal(message) {
  const modal = el('modalOverlay');
  const msg = el('modalMessage');
  if (modal && msg) {
    msg.innerText = message;
    modal.style.display = 'flex';
  }
}

export function closeModal() {
  const modal = el('modalOverlay');
  if (modal) modal.style.display = 'none';
}

let modalCallback = null;

export function openConfirmModal(cb) {
  modalCallback = cb;
  el('confirmModal').classList.remove('hidden');
}

// Configura os botões do modal de confirmação uma única vez
export function initModalListeners() {
  el('modalCancel')?.addEventListener('click', () => {
    modalCallback = null;
    el('confirmModal').classList.add('hidden');
  });

  el('modalConfirm')?.addEventListener('click', async () => {
    if (modalCallback) await modalCallback();
    modalCallback = null;
    el('confirmModal').classList.add('hidden');
  });
  
  // Fecha modal genérico
  window.closeModal = closeModal; 
}
