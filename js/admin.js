import { db } from './firebase.js';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { openConfirmModal } from './modal.js';

export async function loadUsers(){
  userList.innerHTML = '';
  const snap = await getDocs(collection(db,'users'));

  snap.forEach(d=>{
    const u = d.data();
    if(u.role === 'admin') return;

    const row = document.createElement('div');
    row.className = 'user-row';

    row.innerHTML = `
      <div>
        <strong>${u.username}</strong><br>
        <span class="sub">${u.email}</span>
      </div>
      <div>
        <button class="btn ghost">${u.blocked?'Desbloquear':'Bloquear'}</button>
        <button class="btn danger">Excluir</button>
      </div>
    `;

    row.querySelector('.ghost').onclick = async ()=>{
      await updateDoc(doc(db,'users',d.id),{ blocked:!u.blocked });
      loadUsers();
    };

    row.querySelector('.danger').onclick = ()=>{
      openConfirmModal(async()=>{
        await deleteDoc(doc(db,'users',d.id));
        loadUsers();
      });
    };

    userList.appendChild(row);
  });
}
