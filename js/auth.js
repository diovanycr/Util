import {
    auth, db, el, googleProvider,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    collection,
    doc,
    query,
    where
} from './firebase.js';
import { getDoc, getDocs, setDoc } from './firebase-retry.js';

import { showModal, openConfirmModal } from './modal.js';
import { loadUsers } from './admin.js';
import { initMessages, resetMessages, loadMessages, updateTrashCount } from './messages.js';
import { initProblems, resetProblems, loadProblems } from './problems.js';
import { initSearch, resetSearch } from './search.js';
import { initLinks, resetLinks } from './links.js';
import { initEnhancements, resetEnhancements } from './enhancements.js';
import { getGreetingPrefix, setTagColorUser } from './utils.js';

let messagesInitialized = false;
let problemsInitialized = false;

export function initAuth() {
    el('btnLogin').addEventListener('click', doLogin);
    el('loginPass').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doLogin();
    });

    el('btnGoogleLogin').addEventListener('click', doGoogleLogin);

    el('btnLogout').addEventListener('click', () => {
        openConfirmModal(
            () => signOut(auth).catch(console.error),
            null,
            "Deseja realmente sair da sua conta? Você será redirecionado para a tela de login."
        );
    });

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
                    showModal("Sua conta está bloqueada. Entre em contato com o administrador para liberar o acesso.");
                    return;
                }

                el('loginBox').classList.add('hidden');
                el('app').classList.remove('hidden');

                const isAdmin = data.role === 'admin';
                const displayName = data.username || data.email;
                
                updateHeaderProfileGreeting(displayName);
                setTagColorUser(user.uid);

                const userAvatar = el('userAvatar');
                if (userAvatar) {
                    userAvatar.textContent = displayName.charAt(0).toUpperCase();
                    userAvatar.title = isAdmin ? "Administrador" : "Usuário";
                }
                
                const badge = el('headerProfileBadge');
                if (badge) {
                    badge.title = isAdmin ? "Painel Administrador" : "Painel Usuário";
                }

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

                    initSearch(user.uid);
                    initLinks(user.uid);
                    initEnhancements(user.uid);

                    if (!messagesInitialized) {
                        initMessages(user.uid);
                        messagesInitialized = true;
                    } else {
                        loadMessages(user.uid);
                        updateTrashCount(user.uid);
                    }

                    if (!problemsInitialized) {
                        initProblems(user.uid);
                        problemsInitialized = true;
                    } else {
                        loadProblems(user.uid);
                    }
                }

            } catch (error) {
                console.error("Erro ao carregar perfil:", error);
                showModal("Erro ao carregar dados da conta.");
            }
        } else {
            clearHeaderGreetingInterval();
            setTagColorUser('');
            messagesInitialized = false;
            problemsInitialized = false;
            resetSearch();
            resetMessages();
            resetProblems();
            resetLinks();
            resetEnhancements();

            document.dispatchEvent(new Event('user-logout'));

            el('app').classList.add('hidden');
            el('loginBox').classList.remove('hidden');
            el('loginUser').value = '';
            el('loginPass').value = '';

            if (el('userList')) el('userList').innerHTML = '';
            if (el('msgList')) el('msgList').innerHTML = '';
            if (el('problemList')) el('problemList').innerHTML = '';
            if (el('linkList')) el('linkList').innerHTML = '';

            const loggedUserEl = el('loggedUser');
            if (loggedUserEl) {
                loggedUserEl.textContent = '';
                delete loggedUserEl.dataset.username;
            }

            el('loginUser').focus();
        }
    });
}

async function doLogin() {
    const username = el('loginUser').value.trim().toLowerCase();
    // Não faz trim na senha: espaços no início/fim podem ser intencionais
    const password = el('loginPass').value;

    if (!username || !password) {
        showModal("Por favor, informe o usuário e a senha.");
        return;
    }

    const btnLogin = el('btnLogin');
    const originalText = btnLogin ? btnLogin.innerHTML : 'Entrar';

    try {
        if (btnLogin) {
            btnLogin.disabled = true;
            btnLogin.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;"></span> Entrando...';
        }

        const q = query(collection(db, 'users'), where('username', '==', username));
        const snap = await getDocs(q);

        if (snap.empty) {
            showModal("Usuário não encontrado.");
            return;
        }

        if (snap.size > 1) {
            console.error("Múltiplos usuários com mesmo username:", username);
            showModal("Erro: múltiplos usuários com este nome. Contate o administrador.");
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
    } finally {
        if (btnLogin) {
            btnLogin.disabled = false;
            btnLogin.innerHTML = originalText;
        }
    }
}

async function doGoogleLogin() {
    const btnGoogle = el('btnGoogleLogin');
    const originalText = btnGoogle ? btnGoogle.innerHTML : 'Entrar com Google';

    try {
        if (btnGoogle) {
            btnGoogle.disabled = true;
            btnGoogle.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;"></span> Entrando...';
        }

        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
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

            await signOut(auth);
            showModal("Conta criada com sucesso! Aguarde o administrador liberar seu acesso.");
            return;
        }

        // Se já existe, onAuthStateChanged cuida do resto

    } catch (error) {
        console.error("Erro no login com Google:", error.code);

        if (error.code === 'auth/popup-closed-by-user') return;
        if (error.code === 'auth/popup-blocked') {
            showModal("O popup foi bloqueado pelo navegador. Permita popups para este site.");
            return;
        }
        showModal("Erro ao entrar com Google. Tente novamente.");
    } finally {
        if (btnGoogle) {
            btnGoogle.disabled = false;
            btnGoogle.innerHTML = originalText;
        }
    }
}



// --- SAUDAÇÃO DINÂMICA DO HEADER ---
let activeUserDisplayName = '';
let headerTimeInterval = null;

const onHeaderWindowFocus = () => updateHeaderProfileGreeting();

export function updateHeaderProfileGreeting(name) {
    if (name) activeUserDisplayName = name;
    if (!activeUserDisplayName) return;

    const currentHour = new Date().getHours();
    let greetingPrefix = getGreetingPrefix(currentHour);

    const loggedUserEl = el('loggedUser');
    if (loggedUserEl) {
        // data-username guarda o nome puro para {usuario} nas mensagens
        loggedUserEl.dataset.username = activeUserDisplayName;
        loggedUserEl.textContent = `${greetingPrefix}, ${activeUserDisplayName}!`;
    }

    if (!headerTimeInterval) {
        headerTimeInterval = setInterval(() => updateHeaderProfileGreeting(), 30000);
        window.addEventListener('focus', onHeaderWindowFocus);
    }
}

export function clearHeaderGreetingInterval() {
    if (headerTimeInterval) {
        clearInterval(headerTimeInterval);
        headerTimeInterval = null;
    }
    window.removeEventListener('focus', onHeaderWindowFocus);
    activeUserDisplayName = '';
}
