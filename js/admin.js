import { db, el, secondaryAuth, auth } from './firebase.js'; // Certifique-se de exportar 'auth' do firebase.js
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
    signOut,
    sendPasswordResetEmail // Nova importação para o Reset
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

            const isBlocked = u.blocked === true;
            const row = document.createElement('div');
            
            row.className = 'user-row' + (isBlocked ? ' blocked' : '');
            
            row.innerHTML = `
                <div>
                    <strong>${u.username}</strong> 
                    ${isBlocked ? '<span class="status-badge-blocked">Bloqueado</span>' : ''}
                    <br>
                    <span class="sub">${u.email}</span>
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <button class="btn ghost btnBlock">${isBlocked ? 'Desbloquear' : 'Bloquear'}</button>
                    
                    <button class="btn ghost btnReset" title="Resetar Senha" style="color: #f59e0b;">
                        <i class="fa-solid fa-key"></i>
                    </button>

                    <button class="btn danger btnDelete"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;

            // Lógica do botão Reset de Senha
            row.querySelector('.btnReset').onclick = async () => {
                if (confirm(`Enviar e-mail de redefinição de senha para ${u.email}?`)) {
                    try {
                        await sendPasswordResetEmail(auth, u.email);
                        showModal("E-mail de redefinição enviado com sucesso!");
                    } catch (err) {
                        console.error("Erro no reset:", err);
                        showModal("Erro ao enviar e-mail de recuperação.");
                    }
                }
            };

            // Lógica do botão Bloquear/Desbloquear
            row.querySelector('.btnBlock').onclick = async () => {
                await updateDoc(doc(db, 'users', d.id), { blocked: !isBlocked });
                loadUsers();
            };

            // Lógica do botão Excluir
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
            const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            
            await setDoc(doc(db, 'users', cred.user.uid), {
                username,
                email,
                role: 'user',
                blocked: false,
                createdAt: new Date().toISOString()
            });

            await signOut(secondaryAuth);

            el('newUser').value = el('newEmail').value = el('newPass').value = '';
            el('createSuccess').classList.remove('hidden');
            setTimeout(() => el('createSuccess').classList.add('hidden'), 3000);
            
            loadUsers();

        } catch (e) {
            console.error("Erro capturado:", e.code);
            
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
