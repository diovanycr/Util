import { db, el, secondaryAuth } from './firebase.js';
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
    signInAnonymously 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { showModal } from './modal.js';

// --- FUNÇÃO PARA CARREGAR A LISTA DE USUÁRIOS ---
export async function loadUsers() {
    const userList = el('userList');
    if (!userList) return;
    
    userList.innerHTML = ''; // Limpa a lista antes de carregar
    
    try {
        const snap = await getDocs(collection(db, 'users'));
        const seen = new Set();

        snap.forEach(d => {
            const u = d.data();
            
            // Lógica Original: Não listar admins nem duplicados
            const key = `${u.username}|${u.email}`;
            if (seen.has(key)) return;
            seen.add(key);
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
                    <button class="btn danger btnDelete">Excluir</button>
                </div>
            `;

            // Botão Bloquear/Desbloquear
            row.querySelector('.btnBlock').onclick = async () => {
                await updateDoc(doc(db, 'users', d.id), { blocked: !u.blocked });
                loadUsers(); // Recarrega a lista
            };

            // Botão Excluir
            row.querySelector('.btnDelete').onclick = async () => {
                if (confirm(`Excluir usuário ${u.username}?`)) {
                    await deleteDoc(doc(db, 'users', d.id));
                    loadUsers();
                }
            };

            userList.appendChild(row);
        });
    } catch (e) {
        console.error("Erro ao carregar usuários:", e);
    }
}

// --- FUNÇÃO PARA CRIAR NOVOS USUÁRIOS (SÓ PARA ADMIN) ---
export function initAdminActions() {
    const btnCreate = el('btnCreateUser');
    if (!btnCreate) return;

    btnCreate.onclick = async () => {
        const username = el('newUser').value.trim().toLowerCase();
        const email = el('newEmail').value.trim().toLowerCase();
        const password = el('newPass').value.trim();

        if (!username || !email || !password) {
            showModal("Preencha todos os campos para criar o usuário.");
            return;
        }

        try {
            // 1. Verifica duplicidade no Firestore
            const snap = await getDocs(collection(db, 'users'));
            if (snap.docs.some(d => d.data().username?.toLowerCase() === username)) {
                return showModal("Este nome de usuário já existe.");
            }

            // 2. Cria no Firebase Auth usando o app secundário (para não deslogar o admin)
            try { await signInAnonymously(secondaryAuth); } catch(e) {}
            
            const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);

            // 3. Salva os dados no Firestore vinculados ao UID criado
            await setDoc(doc(db, 'users', cred.user.uid), {
                username,
                email,
                role: 'user',
                blocked: false
            });

            // 4. Limpa e desloga o app secundário
            await signOut(secondaryAuth);
            
            el('newUser').value = '';
            el('newEmail').value = '';
            el('newPass').value = '';
            
            el('createSuccess').classList.remove('hidden');
            setTimeout(() => el('createSuccess').classList.add('hidden'), 3000);

            loadUsers(); // Atualiza a lista na tela

        } catch (e) {
            console.error("Erro ao criar:", e);
            showModal("Erro ao criar usuário: " + e.message);
        }
    };
}
