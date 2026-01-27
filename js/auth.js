// js/auth.js

import { auth } from './firebase.js';
import { showModal } from './modal.js';

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { db } from './firebase.js';

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
        // 🔥 NÃO decide nada aqui
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
      // 🔒 deslogado
      loginBox?.classList.remove('hidden');
      app?.classList.add('hidden');
      adminArea?.classList.add('hidden');
      userArea?.classList.add('hidden');
      return;
    }

    // ✅ logado
    loginBox?.classList.add('hidden');
    app?.classList.remove('hidden');

    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const data = snap.exists() ? snap.data() : null;
      const role = data?.role || 'user';

      if (loggedUser) {
        loggedUser.textContent =
          role === 'admin'
            ? 'Logado como: ADMIN'
            : 'Logado como: USUÁRIO';
      }

      if (role === 'admin') {
        adminArea?.classList.remove('hidden');
        userArea?.classList.add('hidden');
      } else {
        userArea?.classList.remove('hidden');
        adminArea?.classList.add('hidden');
      }

    } catch (err) {
      console.error('Erro ao verificar papel do usuário:', err);
      showModal('Erro ao carregar dados do usuário');
    }
  });
}
