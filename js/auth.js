import { auth } from './firebase.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { loadAdmin } from './admin.js';
import { loadUser } from './user.js';

const el = id => document.getElementById(id);

export function initAuth(){
  el('btnLogin').onclick = async () => {
    const user = el('loginUser').value;
    const pass = el('loginPass').value;
    await signInWithEmailAndPassword(auth, user, pass);
  };

  el('btnLogout').onclick = () => signOut(auth);

  onAuthStateChanged(auth, user => {
    if(!user) return;
    el('loginBox').classList.add('hidden');
    el('app').classList.remove('hidden');
    el('loggedUser').textContent = user.email;

    user.email.includes('admin')
      ? loadAdmin()
      : loadUser(user.uid);
  });
}

