import { auth, db, el } from './firebase.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showModal } from './modal.js';
import { loadUsers } from './admin.js';
import { initMessages, loadMessages } from './messages.js';

export function initAuth() {
    // Escuta o botão de login
    el('btnLogin').addEventListener('click', doLogin);

    // Enter no campo senha faz login automático
    el('loginPass').addEventListener('keydown', (e) => {
        if(e.key === 'Enter') doLogin();
    });

    // Logout
    el('btnLogout').addEventListener('click', async () => {
        await signOut(auth);
        // O onAuthStateChanged cuidará de esconder a UI
    });

    // Observador de estado (Igual ao seu fluxo original)
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Busca os dados do usuário no Firestore para saber se é Admin
            const snap = await getDocs(collection(db, 'users'));
            const userDoc = snap.docs.find(d => d.id === user.uid);
            
            if (!userDoc || userDoc.data().blocked) {
                await signOut(auth);
                showModal("Usuário não encontrado ou bloqueado.");
                return;
            }

            const data = userDoc.data();
            const isAdmin = data.role === 'admin';

            el('loginBox').classList.add('hidden');
            el('app').classList.remove('hidden');
            el('loggedUser').textContent = isAdmin
                ? `Logado como: ADMIN (usuário: ${data.username})`
                : `Logado como: USUÁRIO (${data.username})`;

            if (isAdmin) {
                el('adminArea').style.display = 'block';
                el('userArea').classList.add('hidden');
                loadUsers();
            } else {
                el('adminArea').style.display = 'none';
                el('userArea').classList.remove('hidden');
                initMessages(user.uid); // Inicia a lógica de mensagens do usuário
            }
        } else {
            el('app').classList.add('hidden');
            el('loginBox').classList.remove('hidden');
            el('loginUser').value = '';
            el('loginPass').value = '';
        }
    });
}

async function doLogin() {
    const username = el('loginUser').value.trim().toLowerCase();
    const password = el('loginPass').value.trim();

    if (!username || !password) {
        showModal("Preencha todos os campos.");
        return;
    }

    try {
        // 1. Busca usuário pelo Username no Firestore (Lógica original)
        const snap = await getDocs(collection(db, 'users'));
        const userDoc = snap.docs.find(d => (d.data().username || '').toLowerCase() === username);

        if (!userDoc) {
            showModal("Usuário não encontrado.");
            return;
        }

        const user = userDoc.data();
        if (user.blocked) {
            showModal("Usuário bloqueado.");
            return;
        }

        // 2. Faz o login REAL usando o E-mail encontrado
        await signInWithEmailAndPassword(auth, user.email, password);

    } catch (e) {
        console.error('LOGIN ERROR:', e);
        showModal("Usuário ou senha inválidos.");
    }
}
