import { db, auth } from './firebase.js';
import { showModal } from './modal.js';

// Sincronizando para a versão 10.12.2
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentUid = null;

export function initMessages(uid) {
  const msgList = document.getElementById('msgList');
  if (!msgList || !uid) return;

  currentUid = uid;
  loadMessages();

  // Configuração do botão de adicionar (se houver no seu HTML)
  const btnAdd = document.getElementById('btnAddMsg');
  if (btnAdd) {
    btnAdd.onclick = () => {
      const text = document.getElementById('msgText')?.value.trim();
      if (text) addMessage(text);
    };
  }
}

/* ===== FUNÇÕES INTERNAS ===== */

async function loadMessages() {
  const msgList = document.getElementById('msgList');
  msgList.innerHTML = '<div class="sub">Carregando mensagens...</div>';

  try {
    // Busca mensagens que não foram deletadas (lógica de lixeira)
    const q = query(
      collection(db, 'users', currentUid, 'messages'),
      where('deleted', '==', false),
      orderBy('order', 'asc')
    );

    const snap = await getDocs(q);
    msgList.innerHTML = '';

    snap.forEach(docSnap => {
      const item = docSnap.data();
      const div = document.createElement('div');
      div.className = 'user-row';
      div.innerHTML = `
        <div class="content" style="flex:1; cursor:pointer">${item.text}</div>
        <div style="display:flex; gap:8px">
          <button class="btn ghost btnCopy" title="Copiar"><i class="fa-solid fa-copy"></i></button>
          <button class="btn danger btnDel" title="Excluir"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;

      // Eventos
      div.querySelector('.content').onclick = () => copyText(item.text);
      div.querySelector('.btnCopy').onclick = () => copyText(item.text);
      div.querySelector('.btnDel').onclick = () => deleteMessage(docSnap.id);

      msgList.appendChild(div);
    });

    if (snap.empty) {
      msgList.innerHTML = '<div class="sub">Nenhuma mensagem salva.</div>';
    }
  } catch (error) {
    console.error("Erro ao carregar mensagens:", error);
    msgList.innerHTML = '<div class="sub" style="color:red">Erro ao carregar mensagens.</div>';
  }
}

async function addMessage(text) {
  try {
    await addDoc(collection(db, 'users', currentUid, 'messages'), {
      text: text,
      order: Date.now(),
      deleted: false,
      createdAt: Date.now()
    });
    document.getElementById('msgText').value = '';
    loadMessages();
  } catch (error) {
    console.error("Erro ao salvar:", error);
    showModal("Erro ao salvar mensagem.");
  }
}

async function deleteMessage(id) {
  if (!confirm("Deseja mover para a lixeira?")) return;
  try {
    const msgRef = doc(db, 'users', currentUid, 'messages', id);
    // Em vez de deletar fixo, apenas marcamos como deletado
    await updateDoc(msgRef, { deleted: true });
    loadMessages();
  } catch (error) {
    console.error("Erro ao excluir:", error);
  }
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Se tiver um toast, mostre aqui
    alert("Copiado!"); 
  });
}
