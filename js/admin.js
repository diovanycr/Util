import { db, el, secondaryAuth } from './firebase.js';
import { collection, getDocs, updateDoc, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { showModal } from './modal.js';

export async function loadUsers() {
    const userList = el('userList');
    if (!userList) {
        console.error("Erro: Elemento #userList não encontrado no HTML.");
        return;
    }
    
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
                if (confirm(`Excluir ${u.username}?`)) {
                    await deleteDoc(doc(db, 'users', d.id));
                    loadUsers();
                }
            };

            userList.appendChild(row);
        });
    } catch (e) {
        console.error("Erro ao buscar usuários:", e);
        userList.innerHTML = '<p style="color:red">Erro ao carregar dados do Firestore.</p>';
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
            showModal("Por favor, preencha todos os campos.");
            return;
        }

        try {
            // Criação no Firebase Auth
            const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            
            // Gravação no Firestore
            await setDoc(doc(db, 'users', cred.user.uid), {
                username,
                email,
                role: 'user',
                blocked: false
            });

            // Desloga a conta secundária para manter o Admin logado
            await signOut(secondaryAuth);

            // Limpa campos e sucesso
            el('newUser').value = el('newEmail').value = el('newPass').value = '';
            el('createSuccess').classList.remove('hidden');
            setTimeout(() => el('createSuccess').classList.add('hidden'), 3000);
            
            loadUsers();

        } catch (e) {
            console.error("Erro capturado:", e.code);
            
            // TRATAMENTO DO ERRO DE E-MAIL DUPLICADO
            if (e.code === 'auth/email-already-in-use') {
                showModal("Este e-mail já está em uso por outro usuário.");
            } else if (e.code === 'auth/invalid-email') {
                showModal("O formato do e-mail é inválido.");
            } else if (e.code === 'auth/weak-password') {
                showModal("A senha deve ter no mínimo 6 caracteres.");
            } else {
                showModal("Erro ao criar usuário: " + e.message);
            }
        }
    };
}
