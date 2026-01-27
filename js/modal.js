import { el } from './firebase.js';

let modalConfirmCallback = null;
let modalCancelCallback = null; // Nova variável para o segundo caminho

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
 * @param {Function} confirmCb - Executado ao clicar em Confirmar (Substituir)
 * @param {Function} cancelCb - Executado ao clicar em Cancelar (Manter/Ignorar)
 */
export function openConfirmModal(confirmCb, cancelCb = null) {
  modalConfirmCallback = confirmCb;
  modalCancelCallback = cancelCb; // Armazena a função de cancelar, se existir
  
  const confirmModal = el('confirmModal');
  if (confirmModal) {
    confirmModal.classList.remove('hidden');
    confirmModal.style.display = 'flex';
  }
}

export function initModalListeners() {
  // Configura o botão CANCELAR
  el('modalCancel')?.addEventListener('click', async () => {
    // Se houver uma função específica para o cancelamento (ex: importar sem duplicatas), executa.
    if (modalCancelCallback) await modalCancelCallback();
    
    resetCallbacks();
    closeConfirmModal();
  });

  // Configura o botão CONFIRMAR
  el('modalConfirm')?.addEventListener('click', async () => {
    if (modalConfirmCallback) await modalConfirmCallback();
    
    resetCallbacks();
    closeConfirmModal();
  });
  
  window.closeModal = closeModal; 
}

// Funções auxiliares para limpar o código
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
  // Opcional: Reseta o texto do modal para o padrão após o uso
  const confirmP = document.querySelector('#confirmModal .sub');
  if (confirmP) confirmP.innerText = "Esta ação não poderá ser desfeita.";
}
