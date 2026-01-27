import { auth, db, el } from './firebase.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showModal } from './modal.js';
import { loadUsers } from './admin.js';
import { initMessages } from './messages.js';

export function initAuth() {
  el('btnLogin').addEventListener('click', doLogin);
  el('loginPass').addEventListener('keydown', (e) => e.key === 'Enter' && doLogin());
  el('btnLogout').addEventListener('click', () => signOut(auth));

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      el('app').classList.add('hidden');
      el('loginBox').classList.remove('hidden');
      return;
    }

    try {
      const snap = await getDocs(collection(db, 'users'));
      const userDoc = snap.docs.find(d => d.id === user.uid);
      const data = userDoc ? userDoc.data() : null;

      if (!data || data.blocked) {
        signOut(auth);
        showModal("Acesso negado ou conta bloqueada.");
        return;
      }

      el('loginBox').classList.add('hidden');
      el('app').classList.remove('hidden');
      
      const isAdmin = data.role === 'admin';
      el('loggedUser').textContent = isAdmin ? `Admin: ${data.username}` : `Usuário: ${data.username}`;

      if (isAdmin) {
        el('adminArea').style.display = 'block';
        el('userArea').classList.add('hidden');
        loadUsers();
      } else {
        el('adminArea').style.display = 'none';
        el('userArea').classList.remove('hidden');
        initMessages(user.uid);
      }
    } catch (e) {
      console.error(e);
    }
  });
}

async function doLogin() {
  const username = el('loginUser').value.trim().toLowerCase();
  const password = el('loginPass').value.trim();

  if (!username || !password) return showModal("Preencha usuário e senha.");

  try {
    const snap = await getDocs(collection(db, 'users'));
    const userDoc = snap.docs.find(d => (d.data().username || '').toLowerCase() === username);

    if (!userDoc) return showModal("Usuário não encontrado.");
    await signInWithEmailAndPassword(auth, userDoc.data().email, password);
  } catch (e) {
    showModal("Senha incorreta ou erro de conexão.");
  }
}
