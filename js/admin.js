import { db, el, secondaryAuth } from './firebase.js';
import { collection, getDocs, updateDoc, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { showModal } from './modal.js';

export async function loadUsers() {
  el('userList').innerHTML = '';
  const snap = await getDocs(collection(db, 'users'));

  snap.forEach(d => {
    const u = d.data();
    if (u.role === 'admin') return;

    const row = document.createElement('div');
    row.className = 'user-row' + (u.blocked ? ' blocked' : '');
    row.innerHTML = `
      <div><strong>${u.username}</strong><br><span class="sub">${u.email}</span></div>
      <div style="display:flex;gap:8px">
        <button class="btn ghost btnBlock">${u.blocked ? 'Desbloquear' : 'Bloquear'}</button>
        <button class="btn danger btnDelete">Excluir</button>
      </div>
    `;

    row.querySelector('.btnBlock').onclick = async () => {
      await updateDoc(doc(db, 'users', d.id), { blocked: !u.blocked });
      loadUsers();
    };

    row.querySelector('.btnDelete').onclick = async () => {
      if (confirm(`Excluir ${u.username}?`)) {
        await deleteDoc(doc(db, 'users', d.id));
        loadUsers();
      }
    };
    el('userList').appendChild(row);
  });
}

export function initAdminActions() {
  el('btnCreateUser').onclick = async () => {
    const username = el('newUser').value.trim().toLowerCase();
    const email = el('newEmail').value.trim().toLowerCase();
    const password = el('newPass').value.trim();

    if (!username || !email || !password) return showModal("Preencha todos os campos.");

    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        username, email, role: 'user', blocked: false
      });
      await signOut(secondaryAuth);
      
      el('newUser').value = el('newEmail').value = el('newPass').value = '';
      el('createSuccess').classList.remove('hidden');
      setTimeout(() => el('createSuccess').classList.add('hidden'), 3000);
      loadUsers();
    } catch (e) {
      showModal("Erro ao criar usuário: " + e.message);
    }
  };
}
