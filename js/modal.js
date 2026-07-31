import { el } from './firebase.js';

let modalConfirmCallback = null;
let modalCancelCallback = null;
let lastFocusedElement = null;

function trapFocus(containerEl) {
  const focusable = containerEl.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first) return;
  first.focus();

  const handler = (e) => {
    const isTab = e.key === 'Tab';
    if (!isTab) return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  };
  containerEl.addEventListener('keydown', handler);
  // Retorna cleanup
  return () => containerEl.removeEventListener('keydown', handler);
}

function closeModalCommon(modal, returnFocusTo) {
  modal.classList.add('hidden');
  modal.style.display = 'none';
  if (returnFocusTo) returnFocusTo.focus();
}

export function showModal(message) {
  const modal = el('modalOverlay');
  const msg = el('modalMessage');
  if (modal && msg) {
    lastFocusedElement = document.activeElement;
    msg.innerText = message;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    const cleanup = trapFocus(modal);
    modal._focusCleanup = cleanup;
  }
}

export function closeModal() {
  const modal = el('modalOverlay');
  if (modal) {
    if (modal._focusCleanup) modal._focusCleanup();
    closeModalCommon(modal, lastFocusedElement);
    lastFocusedElement = null;
  }
}

export function openConfirmModal(confirmCb, cancelCb = null, message = null) {
  modalConfirmCallback = confirmCb;
  modalCancelCallback = cancelCb;

  const confirmP = document.querySelector('#confirmModal .sub');
  if (confirmP && message) {
    confirmP.innerText = message;
  }

  const confirmModal = el('confirmModal');
  if (confirmModal) {
    lastFocusedElement = document.activeElement;
    confirmModal.classList.remove('hidden');
    confirmModal.style.display = 'flex';
    const cleanup = trapFocus(confirmModal);
    confirmModal._focusCleanup = cleanup;
  }
}

export function initModalListeners() {
  // Fechar modais com Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const alertModal = el('modalOverlay');
      const confirmModal = el('confirmModal');
      const exportModal = el('exportFormatModal');
      if (confirmModal && !confirmModal.classList.contains('hidden')) {
        el('modalCancel')?.click();
      } else if (alertModal && !alertModal.classList.contains('hidden')) {
        closeModal();
      } else if (exportModal && !exportModal.classList.contains('hidden')) {
        exportModal.classList.add('hidden');
        exportModal.style.display = 'none';
        el('btnExport')?.focus();
      }
    }
  });

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

  // Botão OK do modal de alerta
  const modalOkBtn = el('btnModalAlertOk');
  if (modalOkBtn) {
    modalOkBtn.addEventListener('click', closeModal);
  }

  // Fecha ao clicar no overlay (fora da modal-box)
  el('modalOverlay')?.addEventListener('click', (e) => {
    if (e.target === el('modalOverlay')) closeModal();
  });
}

function closeConfirmModal() {
  const modal = el('confirmModal');
  if (modal) {
    if (modal._focusCleanup) modal._focusCleanup();
    closeModalCommon(modal, lastFocusedElement);
    lastFocusedElement = null;
  }
}

function resetCallbacks() {
  modalConfirmCallback = null;
  modalCancelCallback = null;
  const confirmP = document.querySelector('#confirmModal .sub');
  if (confirmP) confirmP.innerText = "Esta ação não poderá ser desfeita.";
}
