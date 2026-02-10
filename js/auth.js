import { 
    auth, db, el, googleProvider,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    collection,
    getDoc,
    getDocs,
    doc,
    setDoc,
    query,
    where
} from './firebase.js';

import { showModal } from './modal.js';
import { loadUsers } from './admin.js';
import { initMessages, resetMessages } from './messages.js';
import { initProblems, resetProblems } from './problems.js';

// ? CORREÇÃO 1: Flags de sessão para evitar listeners duplicados
let messagesInitialized = false;
let problemsInitialized = false;

/**
 * Inicializa os ouvintes de autenticação e monitora a sessão
 */
export function initAuth() {
    // Login por usuário/senha
    el('btnLogin').addEventListener('click', doLogin);

    el('loginPass').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doLogin();
    });

    // Login com Google
    el('btnGoogleLogin').addEventListener('click', doGoogleLogin);

    // Logout
    el('btnLogout').addEventListener('click', async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Erro ao deslogar:", error);
        }
    });

    /**
     * MONITOR DE ESTADO DA SESSÃO
     */
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                const data = userDocSnap.exists() ? userDocSnap.data() : null;

                if (!data) {
                    await signOut(auth);
                    showModal("Acesso negado: Conta não encontrada. Aguarde a aprovação do administrador.");
                    return;
                }

                if (data.blocked) {
                    await signOut(auth);
                    showModal("Sua conta ainda não foi aprovada pelo administrador. Aguarde a liberação.");
                    return;
                }

                // Gerencia a interface
                el('loginBox').classList.add('hidden');
                el('app').classList.remove('hidden');
                
                const isAdmin = data.role === 'admin';
                const displayName = data.username || data.email;
                el('loggedUser').textContent = isAdmin 
                    ? `Painel Admin: ${displayName}` 
                    : `Usuário: ${displayName}`;

                if (isAdmin) {
                    el('adminArea').classList.remove('hidden');
                    el('adminArea').style.display = 'block';
                    el('userArea').classList.add('hidden');
                    el('userArea').style.display = 'none';
                    loadUsers();
                } else {
                    el('adminArea').classList.add('hidden');
                    el('adminArea').style.display = 'none';
                    el('userArea').classList.remove('hidden');
                    el('userArea').style.display = 'block';

                    // ? CORREÇÃO 1: Setup de listeners apenas uma vez por sessão
                    // Chamadas subsequentes do onAuthStateChanged (ex: refresh de token)
                    // apenas recarregam os dados, sem recriar os event listeners
                    if (!messagesInitialized) {
                        initMessages(user.uid);
                        messagesInitialized = true;
                    } else {
                        // Re-carrega dados sem recriar listeners
                        const { loadMessages, updateTrashCount } = await import('./messages.js');
                        loadMessages(user.uid);
                        updateTrashCount(user.uid);
                    }

                    if (!problemsInitialized) {
                        initProblems(user.uid);
                        problemsInitialized = true;
                    } else {
                        const { loadProblems } = await import('./problems.js');
                        if (loadProblems) loadProblems(user.uid);
                    }
                }

            } catch (error) {
                console.error("Erro ao carregar perfil:", error);
                showModal("Erro ao carregar dados da conta.");
            }
        } else {
            // --- LÓGICA DE SAÍDA (LOGOUT) ---

            // ? CORREÇÃO 1: Reseta as flags ao deslogar
            messagesInitialized = false;
            problemsInitialized = false;
            resetMessages();
            resetProblems();

            el('app').classList.add('hidden');
            el('loginBox').classList.remove('hidden');

            el('loginUser').value = '';
            el('loginPass').value = '';
            
            if (el('userList')) el('userList').innerHTML = '';
            if (el('msgList')) el('msgList').innerHTML = '';
            if (el('problemList')) el('problemList').innerHTML = '';
            
            el('loginUser').focus();
        }
    });
}

/**
 * Login por usuário/senha
 */
async function doLogin() {
    const username = el('loginUser').value.trim().toLowerCase();
    const password = el('loginPass').value.trim();

    if (!username || !password) {
        showModal("Por favor, informe o usuário e a senha.");
        return;
    }

    try {
        const q = query(collection(db, 'users'), where('username', '==', username));
        const snap = await getDocs(q);

        if (snap.empty) {
            showModal("Usuário não encontrado.");
            return;
        }

        const email = snap.docs[0].data().email;
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

/**
 * Login com Google
 * - Se já existe doc no Firestore ? entra normalmente (onAuthStateChanged cuida)
 * - Se NÃO existe ? cria doc como bloqueado e desloga
 */
async function doGoogleLogin() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Verifica se já existe um doc no Firestore para este usuário
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            // Primeira vez: cria conta BLOQUEADA
            const username = (user.displayName || user.email.split('@')[0])
                .toLowerCase()
                .replace(/\s+/g, '.');

            await setDoc(userDocRef, {
                username,
                email: user.email.toLowerCase(),
                role: 'user',
                blocked: true,
                provider: 'google',
                photoURL: user.photoURL || null,
                createdAt: new Date().toISOString()
            });

            // Desloga imediatamente
            await signOut(auth);
            showModal("Conta criada com sucesso! Aguarde o administrador liberar seu acesso.");
            return;
        }

        // Se já existe, o onAuthStateChanged cuida do resto

    } catch (error) {
        console.error("Erro no login com Google:", error.code);
        
        if (error.code === 'auth/popup-closed-by-user') {
            return; // Usuário fechou o popup
        }
        if (error.code === 'auth/popup-blocked') {
            showModal("O popup foi bloqueado pelo navegador. Permita popups para este site.");
            return;
        }
        showModal("Erro ao entrar com Google. Tente novamente.");
    }
}
