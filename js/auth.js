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
        if (user) {
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
                ? `Logado como: ADMIN (${data.username})`
                : `Logado como: USUÁRIO (${data.username})`;

            if (isAdmin) {
                // CORREÇÃO: Usando classList para garantir que o 'hidden' do CSS saia
                el('adminArea').classList.remove('hidden');
                el('userArea').classList.add('hidden');
                loadUsers(); // Esta função preenche a lista
            } else {
                el('adminArea').classList.add('hidden');
                el('userArea').classList.remove('hidden');
                initMessages(user.uid);
            }
        } else {
            el('app').classList.add('hidden');
            el('loginBox').classList.remove('hidden');
        }
    });
}

async function doLogin() {
    const username = el('loginUser').value.trim().toLowerCase();
    const password = el('loginPass').value.trim();

    if (!username || !password) return showModal("Preencha todos os campos.");

    try {
        const snap = await getDocs(collection(db, 'users'));
        const userDoc = snap.docs.find(d => (d.data().username || '').toLowerCase() === username);

        if (!userDoc) return showModal("Usuário não encontrado.");
        const user = userDoc.data();
        await signInWithEmailAndPassword(auth, user.email, password);
    } catch (e) {
        showModal("Usuário ou senha inválidos.");
    }
}
