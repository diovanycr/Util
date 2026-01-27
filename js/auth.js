// js/auth.js

import { auth } from './firebase.js';
import { showModal } from './modal.js';

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

export function initAuth() {
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');

  // 🔹 LOGIN
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');

      const email = emailInput?.value.trim();
      const password = passwordInput?.value;

      if (!email || !password) {
        showModal('Preencha email e senha');
        return;
      }

      try {
        await signInWithEmailAndPassword(auth, email, password);
        // ❗ NÃO chama admin.js aqui
      } catch (error) {
        showModal('Usuário ou senha inválidos');
        console.error(error);
      }
    });
  }

  // 🔹 LOGOUT
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

  // 🔹 ESTADO DE AUTENTICAÇÃO (opcional UI)
  onAuthStateChanged(auth, (user) => {
    document.body.classList.toggle('logged', !!user);
  });
}
