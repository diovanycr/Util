import { db, el, secondaryAuth } from './firebase.js';
// Importação correta separada por módulos
import { 
    collection, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 

import { 
    createUserWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { showModal } from './modal.js';

export async function loadUsers() {
    const userList = el('userList');
    if (!userList) return;
    
    userList.innerHTML = '<p class="sub">Carregando usuários...</p>';
    
    try {
        const snap = await getDocs(collection(db, 'users'));
        userList.innerHTML = ''; 

        if (snap.empty) {
            userList.innerHTML = '<p class="sub">Nenhum usuário cadastrado.</p>';
            return;
        }

        snap.forEach(d => {
            const u = d.data();
            if (u.role === 'admin') return;

            const row = document.createElement('div');
            row.className = 'user-row' + (u.blocked ? ' blocked' : '');
            row.innerHTML = `
                <div>
                    <strong>${u.username}</strong><br>
                    <span class="sub">${u.email}</span>
                </div>
                <div style="display:flex;gap:8px">
                    <button class="btn ghost btnBlock">${u.blocked ? 'Desbloquear' : 'Bloquear'}</button>
                    <button class="btn danger btnDelete"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;

            row.querySelector('.btnBlock').onclick = async () => {
                await updateDoc(doc(db, 'users', d.id), { blocked: !u.blocked });
                loadUsers();
            };

            row.querySelector('.btnDelete').onclick = async () => {
                if (confirm(`Deseja realmente excluir ${u.username}?`)) {
                    await deleteDoc(doc(db, 'users', d.id));
                    loadUsers();
                }
            };

            userList.appendChild(row);
        });
    } catch (e) {
        console.error("Erro ao carregar lista:", e);
    }
}

export function initAdminActions() {
    const btn = el('btnCreateUser');
    if (!btn) return;

    btn.onclick = async () => {
        const username = el('newUser').value.trim().toLowerCase();
        const email = el('newEmail').value.trim().toLowerCase();
        const password = el('newPass').value.trim();

        if (!username || !email || !password) {
            showModal("Preencha todos os campos para continuar.");
            return;
        }

        try {
            // Criação no Firebase Auth através da instância secundária
            const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            
            // Salva dados adicionais no Firestore
            await setDoc(doc(db, 'users', cred.user.uid), {
                username,
                email,
                role: 'user',
                blocked: false,
                createdAt: new Date().toISOString()
            });

            // Desloga a conta criada do app secundário para não afetar o Admin
            await signOut(secondaryAuth);

            // Sucesso
            el('newUser').value = el('newEmail').value = el('newPass').value = '';
            el('createSuccess').classList.remove('hidden');
            setTimeout(() => el('createSuccess').classList.add('hidden'), 3000);
            
            loadUsers();

        } catch (e) {
            console.error("Erro capturado:", e.code);
            
            // LÓGICA DO MODAL DE ERRO PARA E-MAIL EXISTENTE
            if (e.code === 'auth/email-already-in-use') {
                showModal("Ops! Este e-mail já está sendo usado por outro usuário.");
            } else if (e.code === 'auth/weak-password') {
                showModal("Senha muito fraca. Use pelo menos 6 caracteres.");
            } else if (e.code === 'auth/invalid-email') {
                showModal("O endereço de e-mail informado não é válido.");
            } else {
                showModal("Ocorreu um erro ao criar o usuário. Tente novamente.");
            }
        }
    };
}
