import { db, el, secondaryAuth } from './firebase.js';
import { collection, getDocs, updateDoc, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { showModal } from './modal.js';

export async function loadUsers() {
    const userList = el('userList');
    if (!userList) return;
    
    userList.innerHTML = '<p style="padding:10px">Carregando usuários...</p>';
    
    try {
        const snap = await getDocs(collection(db, 'users'));
        userList.innerHTML = ''; // Limpa o "Carregando"

        if (snap.empty) {
            userList.innerHTML = '<p style="padding:10px">Nenhum usuário encontrado.</p>';
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

            // Evento Bloquear
            row.querySelector('.btnBlock').onclick = async () => {
                await updateDoc(doc(db, 'users', d.id), { blocked: !u.blocked });
                loadUsers();
            };

            // Evento Deletar
            row.querySelector('.btnDelete').onclick = async () => {
                if (confirm(`Excluir ${u.username}?`)) {
                    await deleteDoc(doc(db, 'users', d.id));
                    loadUsers();
                }
            };

            userList.appendChild(row);
        });
    } catch (e) {
        console.error("Erro ao carregar lista:", e);
        userList.innerHTML = '<p style="color:red">Erro ao carregar usuários.</p>';
    }
}

export function initAdminActions() {
    const btn = el('btnCreateUser');
    if (!btn) return;

    btn.onclick = async () => {
        const username = el('newUser').value.trim().toLowerCase();
        const email = el('newEmail').value.trim().toLowerCase();
        const password = el('newPass').value.trim();

        if (!username || !email || !password) return showModal("Preencha tudo!");

        try {
            // Cria no App Secundário para não deslogar o Admin atual
            const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            
            // Salva no Firestore
            await setDoc(doc(db, 'users', cred.user.uid), {
                username,
                email,
                role: 'user',
                blocked: false
            });

            // Desloga o novo usuário da instância secundária
            await signOut(secondaryAuth);

            // Limpa campos e avisa
            el('newUser').value = el('newEmail').value = el('newPass').value = '';
            el('createSuccess').classList.remove('hidden');
            setTimeout(() => el('createSuccess').classList.add('hidden'), 3000);
            
            loadUsers(); // Atualiza a lista na hora

        } catch (e) {
            console.error("Erro ao criar:", e.code);
            if (e.code === 'auth/email-already-in-use') {
                showModal("Este e-mail já está cadastrado.");
            } else if (e.code === 'auth/weak-password') {
                showModal("A senha deve ter pelo menos 6 caracteres.");
            } else {
                showModal("Erro: " + e.message);
            }
        }
    };
}
