// js/modal.js

export function showModal(message = '') {
  const modal = document.getElementById('modalOverlay');
  const msg = document.getElementById('modalMessage');

  // fallback de segurança
  if (!modal || !msg) {
    alert(message);
    return;
  }

  msg.innerText = message;
  modal.style.display = 'flex';
}

export function closeModal() {
  const modal = document.getElementById('modalOverlay');
  if (modal) modal.style.display = 'none';
}
