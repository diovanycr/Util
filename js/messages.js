// js/messages.js

import { db } from './firebase.js';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

export function initMessages() {
  const msgList = document.getElementById('msgList');
  if (!msgList) return;

  loadMessages();
}

/* ===== FUNÇÕES INTERNAS (NÃO EXPORTAR) ===== */

async function loadMessages() {
  // lógica de carregar mensagens
}

async function addMessage(text) {
  // lógica de salvar mensagem
}

async function deleteMessage(id) {
  // lógica de excluir
}


function copy(text){
  navigator.clipboard.writeText(text);
}
