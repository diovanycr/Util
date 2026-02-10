import { el } from './firebase.js';

let modalConfirmCallback = null;
let modalCancelCallback = null;

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

/**
 * Abre o modal de confirmação.
 * @param {Function} confirmCb - Executado ao clicar em Confirmar
 * @param {Function} cancelCb - Executado ao clicar em Cancelar
 * @param {string} [message] - Mensagem personalizada (opcional)
 */
export function openConfirmModal(confirmCb, cancelCb = null, message = null) {
  modalConfirmCallback = confirmCb;
  modalCancelCallback = cancelCb;
  
  // Atualiza mensagem se fornecida
  const confirmP = document.querySelector('#confirmModal .sub');
  if (confirmP && message) {
    confirmP.innerText = message;
  }
  
  const confirmModal = el('confirmModal');
  if (confirmModal) {
    confirmModal.classList.remove('hidden');
    confirmModal.style.display = 'flex';
  }
}

export function initModalListeners() {
  // Botão CANCELAR do confirm modal
  el('modalCancel')?.addEventListener('click', async () => {
    if (modalCancelCallback) await modalCancelCallback();
    resetCallbacks();
    closeConfirmModal();
  });

  // Botão CONFIRMAR do confirm modal
  el('modalConfirm')?.addEventListener('click', async () => {
    if (modalConfirmCallback) await modalConfirmCallback();
    resetCallbacks();
    closeConfirmModal();
  });
  
  // Botão OK do modal de alerta (substituindo onclick inline no HTML)
  const modalOkBtn = document.querySelector('#modalOverlay .btn.primary');
  if (modalOkBtn) {
    modalOkBtn.addEventListener('click', closeModal);
  }

  // Backdrop do modal de alerta
  const backdrop = document.querySelector('#modalOverlay .modal-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', closeModal);
  }
}

function closeConfirmModal() {
  const modal = el('confirmModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

function resetCallbacks() {
  modalConfirmCallback = null;
  modalCancelCallback = null;
  const confirmP = document.querySelector('#confirmModal .sub');
  if (confirmP) confirmP.innerText = "Esta ação não poderá ser desfeita.";
}
