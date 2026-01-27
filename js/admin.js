import { auth, db, el } from './firebase.js'; // el é o atalho que criamos no firebase.js
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let userList; 

// 🔹 inicializador do módulo
export function initAdmin() {
  userList = document.getElementById('userList');

  if (!userList) return;

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      userList.innerHTML = '';
      return;
    }
    
    // Opcional: Você pode adicionar uma verificação extra de papel aqui se desejar
    loadUsers();
  });
}

// 🔹 carrega usuários (Firestore)
async function loadUsers() {
  if (!userList) return;

  userList.innerHTML = '<div class="sub">Carregando usuários...</div>';

  try {
    const snapshot = await getDocs(collection(db, 'users'));

    userList.innerHTML = '';

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      // Ignora o próprio admin na listagem para evitar auto-exclusão acidental
      if (data.role === 'admin') return;

      const div = document.createElement('div');
      div.className = 'user-row'; // Usando a classe que definimos no CSS

      div.innerHTML = `
        <div>
            <strong>${data.username || 'Sem nome'}</strong><br>
            <span class="sub">${data.email || 'Sem email'}</span>
        </div>
        <div style="display:flex; gap:8px;">
            <button class="btn danger btnDelete" data-id="${docSnap.id}">
                <i class="fa-solid fa-trash"></i> Excluir
            </button>
        </div>
      `;

      div.querySelector('.btnDelete').addEventListener('click', () => {
        deleteUser(docSnap.id);
      });

      userList.appendChild(div);
    });

    if (userList.innerHTML === '') {
      userList.innerHTML = '<div class="sub">Nenhum usuário encontrado</div>';
    }

  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
    userList.innerHTML = '<div class="sub" style="color:red">Erro ao carregar usuários no banco.</div>';
  }
}

// 🔹 excluir usuário
async function deleteUser(userId) {
  // Nota: Idealmente use o modal.js que você já tem para confirmar
  if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

  try {
    await deleteDoc(doc(db, 'users', userId));
    loadUsers();
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    alert('Erro ao excluir usuário no banco de dados.');
  }
}
