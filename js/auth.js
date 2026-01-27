import { auth, db, el } from './firebase.js';
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    collection, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showModal } from './modal.js';
import { loadUsers } from './admin.js';
import { initMessages } from './messages.js';

/**
 * Inicializa os ouvintes de autenticação e monitora a sessão
 */
export function initAuth() {
    // Evento de clique no botão de login
    el('btnLogin').addEventListener('click', doLogin);

    // Atalho: apertar Enter no campo de senha dispara o login
    el('loginPass').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doLogin();
    });

    // Evento de Logout
    el('btnLogout').addEventListener('click', async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Erro ao deslogar:", error);
        }
    });

    /**
     * MONITOR DE ESTADO DA SESSÃO
     * Dispara sempre que o usuário entra ou sai
     */
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                // 1. Busca os dados do perfil no Firestore
                const snap = await getDocs(collection(db, 'users'));
                const userDoc = snap.docs.find(d => d.id === user.uid);
                const data = userDoc ? userDoc.data() : null;

                // 2. Verifica se o usuário existe ou se está bloqueado
                if (!data || data.blocked) {
                    await signOut(auth);
                    showModal("Acesso negado: Conta inexistente ou bloqueada.");
                    return;
                }

                // 3. Gerencia a interface
                el('loginBox').classList.add('hidden');
                el('app').classList.remove('hidden');
                
                const isAdmin = data.role === 'admin';
                el('loggedUser').textContent = isAdmin 
                    ? `Painel Admin: ${data.username}` 
                    : `Usuário: ${data.username}`;

                if (isAdmin) {
                    // Prepara Área Admin
                    el('adminArea').classList.remove('hidden');
                    el('adminArea').style.display = 'block';
                    el('userArea').classList.add('hidden');
                    el('userArea').style.display = 'none';
                    loadUsers(); // Carrega lista de usuários
                } else {
                    // Prepara Área Usuário
                    el('adminArea').classList.add('hidden');
                    el('adminArea').style.display = 'none';
                    el('userArea').classList.remove('hidden');
                    el('userArea').style.display = 'block';
                    initMessages(user.uid); // Carrega mensagens do usuário
                }

            } catch (error) {
                console.error("Erro ao carregar perfil:", error);
                showModal("Erro ao carregar dados da conta.");
            }
        } else {
            // --- LÓGICA DE SAÍDA (LOGOUT) ---
            // 1. Esconde a aplicação
            el('app').classList.add('hidden');
            el('loginBox').classList.remove('hidden');

            // 2. LIMPA OS CAMPOS DE LOGIN (Resolve o seu problema)
            el('loginUser').value = '';
            el('loginPass').value = '';
            
            // 3. Limpa os containers de dados por segurança
            if (el('userList')) el('userList').innerHTML = '';
            if (el('msgList')) el('msgList').innerHTML = '';
            
            // 4. Coloca o foco de volta no campo usuário
            el('loginUser').focus();
        }
    });
}

/**
 * Lógica de processamento do Login
 */
async function doLogin() {
    const username = el('loginUser').value.trim().toLowerCase();
    const password = el('loginPass').value.trim();

    if (!username || !password) {
        showModal("Por favor, informe o usuário e a senha.");
        return;
    }

    try {
        // Busca o e-mail real associado ao username no Firestore
        const snap = await getDocs(collection(db, 'users'));
        const userDoc = snap.docs.find(d => (d.data().username || '').toLowerCase() === username);

        if (!userDoc) {
            showModal("Usuário não encontrado.");
            return;
        }

        const email = userDoc.data().email;
        
        // Faz a autenticação oficial do Firebase
        await signInWithEmailAndPassword(auth, email, password);

    } catch (error) {
        console.error("Erro no login:", error.code);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            showModal("Senha incorreta.");
        } else {
            showModal("Erro ao tentar entrar. Verifique sua conexão.");
        }
    }
}
