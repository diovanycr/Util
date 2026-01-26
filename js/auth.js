import { auth, db } from './firebase.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { loadAdmin } from './admin.js';
import { loadUser } from './user.js';

const el = id => document.getElementById(id);

export function initAuth(){

  el('btnLogin').onclick = async () => {
    const username = el('loginUser').value.trim();
    const password = el('loginPass').value.trim();

    if(!username || !password){
      alert('Preencha usuário e senha');
      return;
    }

    try {
      // 🔎 Busca usuário pelo username
      const q = query(
        collection(db, 'users'),
        where('username', '==', username)
      );

      const snap = await getDocs(q);

      if(snap.empty){
        alert('Usuário não encontrado');
        return;
      }

      const userData = snap.docs[0].data();

      if(userData.blocked){
        alert('Usuário bloqueado');
        return;
      }

      // 🔐 Login com e-mail real
      await signInWithEmailAndPassword(auth, userData.email, password);

    } catch (e) {
      console.error('LOGIN ERROR:', e);
      alert(e.message);
    }
  };

  el('btnLogout').onclick = () => signOut(auth);

  onAuthStateChanged(auth, user => {
    if(!user){
      el('loginBox').classList.remove('hidden');
      el('app').classList.add('hidden');
      return;
    }

    el('loginBox').classList.add('hidden');
    el('app').classList.remove('hidden');

    // Verifica role no Firestore
    loadUserData(user.uid);
  });
}

async function loadUserData(uid){
  const q = query(
    collection(db,'users'),
    where('__name__','==',uid)
  );

  const snap = await getDocs(q);

  if(snap.empty){
    alert('Usuário sem registro');
    return;
  }

  const data = snap.docs[0].data();
  el('loggedUser').textContent = data.username;

  if(data.role === 'admin'){
    loadAdmin();
  } else {
    loadUser(uid);
  }
}
