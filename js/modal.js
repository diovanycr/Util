let confirmCallback = null;

export function showModal(message){
  const overlay = document.getElementById('modalOverlay');
  document.getElementById('modalMessage').innerText = message;
  overlay.style.display = 'flex';
}

export function closeModal(){
  document.getElementById('modalOverlay').style.display = 'none';
}

export function openConfirmModal(cb){
  confirmCallback = cb;
  document.getElementById('confirmModal').classList.remove('hidden');
}

document.getElementById('modalCancel')?.addEventListener('click',()=>{
  confirmCallback = null;
  document.getElementById('confirmModal').classList.add('hidden');
});

document.getElementById('modalConfirm')?.addEventListener('click', async ()=>{
  if(confirmCallback) await confirmCallback();
  confirmCallback = null;
  document.getElementById('confirmModal').classList.add('hidden');
});
