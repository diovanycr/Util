import { el } from './firebase.js';

let modalConfirmCallback = null;
let modalCancelCallback = null;

// Stack of currently open modal containers
const activeModalStack = [];

/**
 * Gets focusable elements inside a container.
 */
function getFocusableElements(containerEl) {
  if (!containerEl) return [];
  return Array.from(
    containerEl.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement);
}

/**
 * Traps Tab / Shift+Tab focus inside a modal container.
 */
export function trapFocus(containerEl) {
  const handler = (e) => {
    if (e.key !== 'Tab') return;

    const focusables = getFocusableElements(containerEl);
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first || !containerEl.contains(document.activeElement)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last || !containerEl.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  containerEl.addEventListener('keydown', handler);
  return () => containerEl.removeEventListener('keydown', handler);
}

/**
 * Returns the currently active top modal container, or null.
 */
export function getActiveModal() {
  return activeModalStack.length > 0 ? activeModalStack[activeModalStack.length - 1] : null;
}

/**
 * Opens a modal container with full accessibility (focus trap, initial focus, focus memory).
 * @param {HTMLElement & { _previousFocus?: Element|null; _focusCleanup?: (() => void)|null }} containerEl The modal overlay element
 * @param {HTMLElement|null} focusTarget Element to focus initially (optional)
 */
export function openModalContainer(containerEl, focusTarget = null) {
  if (!containerEl) return;

  // Save focus origin if current active element is not inside this modal
  if (document.activeElement && !containerEl.contains(document.activeElement)) {
    containerEl._previousFocus = document.activeElement;
  }

  // Push to stack if not already top
  const stackIndex = activeModalStack.indexOf(containerEl);
  if (stackIndex >= 0) {
    activeModalStack.splice(stackIndex, 1);
  }
  activeModalStack.push(containerEl);

  containerEl.setAttribute('aria-modal', 'true');
  containerEl.classList.remove('hidden');
  containerEl.style.display = 'flex';

  // Clean up any existing focus trap
  if (containerEl._focusCleanup) {
    containerEl._focusCleanup();
  }
  containerEl._focusCleanup = trapFocus(containerEl);

  // Set initial focus
  requestAnimationFrame(() => {
    if (focusTarget && typeof focusTarget.focus === 'function') {
      focusTarget.focus();
    } else {
      const focusables = getFocusableElements(containerEl);
      if (focusables.length > 0) {
        focusables[0].focus();
      }
    }
  });
}

/**
 * Closes a modal container, cleans up focus trap, and restores previous focus.
 * @param {(HTMLElement & { _previousFocus?: Element|null; _focusCleanup?: (() => void)|null })|null} containerEl The modal overlay element to close (defaults to top active modal)
 */
export function closeModalContainer(containerEl = null) {
  const targetModal = containerEl || getActiveModal();
  if (!targetModal) return;

  // Clean up focus trap
  if (targetModal._focusCleanup) {
    targetModal._focusCleanup();
    targetModal._focusCleanup = null;
  }

  targetModal.classList.add('hidden');
  targetModal.style.display = 'none';

  // Remove from stack
  const stackIndex = activeModalStack.indexOf(targetModal);
  if (stackIndex >= 0) {
    activeModalStack.splice(stackIndex, 1);
  }

  // Restore focus
  const returnFocus = targetModal._previousFocus;
  targetModal._previousFocus = null;
  if (returnFocus && typeof returnFocus.focus === 'function' && document.body.contains(returnFocus)) {
    requestAnimationFrame(() => returnFocus.focus());
  }
}

export function showModal(message) {
  const modal = el('modalOverlay');
  const msg = el('modalMessage');
  if (modal && msg) {
    msg.innerText = message;
    openModalContainer(modal, el('btnModalAlertOk'));
  }
}

export function closeModal() {
  const modal = el('modalOverlay');
  if (modal) {
    closeModalContainer(modal);
  }
}

export function openConfirmModal(confirmCb, cancelCb = null, message = null, confirmText = 'Confirmar', cancelText = 'Cancelar') {
  modalConfirmCallback = confirmCb;
  modalCancelCallback = cancelCb;

  const confirmP = /** @type {HTMLElement|null} */ (document.querySelector('#confirmModal .sub'));
  if (confirmP && message) {
    confirmP.innerText = message;
  }

  const confirmBtn = el('modalConfirm');
  const cancelBtn = el('modalCancel');
  if (confirmBtn) confirmBtn.innerText = confirmText;
  if (cancelBtn) cancelBtn.innerText = cancelText;

  const confirmModal = el('confirmModal');
  if (confirmModal) {
    openModalContainer(confirmModal, cancelBtn || confirmBtn);
  }
}

export function initModalListeners() {
  // Fechar modais com Escape (hierárquico pela pilha)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const topModal = getActiveModal();
      if (!topModal) return;

      e.stopPropagation();

      if (topModal.id === 'confirmModal') {
        el('modalCancel')?.click();
      } else if (topModal.id === 'modalOverlay') {
        closeModal();
      } else if (topModal.id === 'exportFormatModal') {
        closeModalContainer(topModal);
      } else if (topModal.id === 'helpModal') {
        const btnClose = el('btnCloseHelp');
        if (btnClose) btnClose.click();
        else closeModalContainer(topModal);
      } else if (topModal.id === 'globalSearchModal') {
        const input = el('globalSearchInput');
        if (input) input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        closeModalContainer(topModal);
      } else if (topModal.id === 'deptModal') {
        const btnCancel = el('btnCancelDept');
        if (btnCancel) btnCancel.click();
        else closeModalContainer(topModal);
      } else if (topModal.id === 'aiAssistantModal') {
        const btnClose = el('btnCloseAiModal');
        if (btnClose) btnClose.click();
        else closeModalContainer(topModal);
      } else {
        closeModalContainer(topModal);
      }
    }
  });

  // Botão CANCELAR do confirm modal
  el('modalCancel')?.addEventListener('click', async () => {
    try { if (modalCancelCallback) await modalCancelCallback(); }
    catch (e) { console.error("Erro no callback de cancelamento:", e); }
    finally { resetCallbacks(); closeConfirmModal(); }
  });

  // Botão CONFIRMAR do confirm modal
  el('modalConfirm')?.addEventListener('click', async () => {
    try { if (modalConfirmCallback) await modalConfirmCallback(); }
    catch (e) { console.error("Erro no callback de confirmação:", e); }
    finally { resetCallbacks(); closeConfirmModal(); }
  });

  // Botão OK do modal de alerta
  const modalOkBtn = el('btnModalAlertOk');
  if (modalOkBtn) {
    modalOkBtn.addEventListener('click', closeModal);
  }

  // Fecha ao clicar no overlay (fora da modal-box)
  const modalOverlay = el('modalOverlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  const confirmModal = el('confirmModal');
  if (confirmModal) {
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) el('modalCancel')?.click();
    });
  }
}

function closeConfirmModal() {
  const modal = el('confirmModal');
  if (modal) {
    closeModalContainer(modal);
  }
}

function resetCallbacks() {
  modalConfirmCallback = null;
  modalCancelCallback = null;
  const confirmP = /** @type {HTMLElement|null} */ (document.querySelector('#confirmModal .sub'));
  if (confirmP) confirmP.innerText = "Esta ação não poderá ser desfeita.";
  const confirmBtn = el('modalConfirm');
  const cancelBtn = el('modalCancel');
  if (confirmBtn) confirmBtn.innerText = "Confirmar";
  if (cancelBtn) cancelBtn.innerText = "Cancelar";
}
