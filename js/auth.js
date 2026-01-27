import { auth, db } from './firebase.js'; // Importa as instâncias centralizadas
import { showModal } from './modal.js';

// Importando da mesma versão (10.12.2) para evitar conflitos
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export function initAuth() {
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');

  const loginBox = document.getElementById('loginBox');
  const app = document.getElementById('app');
  const adminArea = document.getElementById('adminArea');
  const userArea = document.getElementById('userArea');
  const loggedUser = document.getElementById('loggedUser');

  /* ======================
      LOGIN
  ====================== */
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email')?.value.trim();
      const password = document.getElementById('password')?.value;

      if (!email || !password) {
        showModal('Preencha email e senha');
        return;
      }

      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error) {
        showModal('Usuário ou senha inválidos');
        console.error(error);
      }
    });
  }

  /* ======================
      LOGOUT
  ====================== */
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
      } catch (error) {
        showModal('Erro ao sair');
        console.error(error);
      }
    });
  }

  /* ======================
      ESTADO DE AUTENTICAÇÃO
  ====================== */
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // 🔒 Deslogado: Limpa a interface
      loginBox?.classList.remove('hidden');
      app?.classList.add('hidden');
      adminArea?.classList.add('hidden');
      userArea?.classList.add('hidden');
      return;
    }

    // ✅ Logado: Mostra o app
    loginBox?.classList.add('hidden');
    app?.classList.remove('hidden');

    try {
      // Busca o documento do usuário pelo UID
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      
      if (snap.exists()) {
        const data = snap.data();
        const role = data.role || 'user';

        if (loggedUser) {
          loggedUser.textContent = role === 'admin' 
            ? `Admin: ${data.username || user.email}` 
            : `Usuário: ${data.username || user.email}`;
        }

        // Alterna as áreas de acordo com o nível de acesso
        if (role === 'admin') {
          adminArea?.classList.remove('hidden');
          userArea?.classList.add('hidden');
          // Se tiver uma função loadUsers() no admin.js, chame aqui
        } else {
          userArea?.classList.remove('hidden');
          adminArea?.classList.add('hidden');
          // Se tiver uma função loadMessages() no messages.js, chame aqui
        }
      } else {
        console.error('Documento do usuário não encontrado no Firestore');
        showModal('Erro: Perfil de usuário não configurado.');
      }

    } catch (err) {
      console.error('Erro ao verificar papel do usuário:', err);
      showModal('Erro ao carregar permissões');
    }
  });
}
