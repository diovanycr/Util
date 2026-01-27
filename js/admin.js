// js/admin.js

import { auth, db } from './firebase.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  collection,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

let userList; // escopo do módulo

// 🔹 inicializador do módulo
export function initAdmin() {
  userList = document.getElementById('userList');

  // se não existir na tela, sai silenciosamente
  if (!userList) return;

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      userList.innerHTML = '';
      return;
    }

    // aqui você pode validar se é admin
    loadUsers();
  });
}

// 🔹 carrega usuários (Firestore)
async function loadUsers() {
  if (!userList) return;

  userList.innerHTML = '<li>Carregando usuários...</li>';

  try {
    const snapshot = await getDocs(collection(db, 'users'));

    userList.innerHTML = '';

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      const li = document.createElement('li');
      li.className = 'user-item';

      li.innerHTML = `
        <span>${data.email || 'Sem email'}</span>
        <button data-id="${docSnap.id}">Excluir</button>
      `;

      li.querySelector('button').addEventListener('click', () => {
        deleteUser(docSnap.id);
      });

      userList.appendChild(li);
    });

    if (snapshot.empty) {
      userList.innerHTML = '<li>Nenhum usuário encontrado</li>';
    }

  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
    userList.innerHTML = '<li>Erro ao carregar usuários</li>';
  }
}

// 🔹 excluir usuário
async function deleteUser(userId) {
  if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

  try {
    await deleteDoc(doc(db, 'users', userId));
    loadUsers();
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    alert('Erro ao excluir usuário');
  }
}
