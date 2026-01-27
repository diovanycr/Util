import { db, el } from './firebase.js';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { openConfirmModal, showModal } from './modal.js';

let currentUid = null;
let dragSrc = null;

export function initMessages(uid) {
  currentUid = uid;
  loadMessages();
  setupMessageListeners();
}

function setupMessageListeners() {
  el('btnNewMsg').onclick = () => { el('newMsgBox').classList.remove('hidden'); el('msgText').focus(); };
  el('btnCancelMsg').onclick = () => { el('msgText').value = ''; el('newMsgBox').classList.add('hidden'); };
  el('btnAddMsg').onclick = handleSaveMessage;
  el('btnTrashToggle').onclick = () => el('trashActions').classList.toggle('hidden');
  el('btnTrashMain').onclick = () => { el('trashBox').classList.remove('hidden'); loadTrash(); };
  el('btnCancelTrash').onclick = () => el('trashBox').classList.add('hidden');
}

async function loadMessages() {
  const list = el('msgList');
  list.innerHTML = '';
  const snap = await getDocs(collection(db, 'users', currentUid, 'messages'));
  
  const docs = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(d => !d.deleted)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  docs.forEach(item => {
    const row = document.createElement('div');
    row.className = 'user-row';
    row.draggable = true;
    row.dataset.id = item.id;
    row.innerHTML = `
      <span class="drag-handle">&#9776;</span>
      <div class="msg-content" style="flex:1;cursor:pointer">${item.text}</div>
      <button class="btn danger btnDel"><i class="fa-solid fa-trash"></i></button>
    `;

    // Drag & Drop
    row.ondragstart = () => { dragSrc = row; row.style.opacity = '0.5'; };
    row.ondragend = () => { row.style.opacity = '1'; saveOrder(); };
    row.ondragover = e => {
      e.preventDefault();
      const rect = row.getBoundingClientRect();
      if (e.clientY > rect.top + rect.height / 2) list.insertBefore(dragSrc, row.nextSibling);
      else list.insertBefore(dragSrc, row);
    };

    // Copiar
    row.querySelector('.msg-content').onclick = () => copyToClipboard(item.text);

    // Lixeira
    row.querySelector('.btnDel').onclick = () => openConfirmModal(async () => {
      await updateDoc(doc(db, 'users', currentUid, 'messages', item.id), { deleted: true });
      loadMessages();
    });

    list.appendChild(row);
  });
}

async function saveOrder() {
  const rows = [...el('msgList').children];
  for (let i = 0; i < rows.length; i++) {
    const id = rows[i].dataset.id;
    if (id) await updateDoc(doc(db, 'users', currentUid, 'messages', id), { order: i + 1 });
  }
}

async function handleSaveMessage() {
  const text = el('msgText').value.trim();
  if (!text) return;
  await addDoc(collection(db, 'users', currentUid, 'messages'), {
    text, order: Date.now(), deleted: false
  });
  el('msgText').value = '';
  el('newMsgBox').classList.add('hidden');
  loadMessages();
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  alert("Copiado!");
}

async function loadTrash() { /* Lógica similar para deletados... */ }
