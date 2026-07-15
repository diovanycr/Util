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
import { initSearch } from './search.js';
import { initLinks, resetLinks } from './links.js';
import { initEnhancements } from './enhancements.js';

let messagesInitialized = false;
let problemsInitialized = false;

export function initAuth() {
    el('btnLogin').addEventListener('click', doLogin);
    el('loginPass').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doLogin();
    });

    el('btnGoogleLogin').addEventListener('click', doGoogleLogin);

    el('btnLogout').addEventListener('click', () => {
        showConfirmLogout(() => signOut(auth).catch(console.error));
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
                
                el('loggedUser').textContent = displayName;
                
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

async function doGoogleLogin() {
    try {
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
    }
}

function showConfirmLogout(onConfirm) {
    // Remove overlay duplicado se existir
    document.getElementById('logoutConfirmOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'logoutConfirmOverlay';
    overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.55);
        display: flex; align-items: center; justify-content: center;
        z-index: 9999; backdrop-filter: blur(4px);
        animation: fadeIn 0.15s ease;
    `;

    overlay.innerHTML = `
        <div style="
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 28px 28px 22px;
            max-width: 340px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.35);
            text-align: center;
        ">
            <div style="font-size: 34px; margin-bottom: 12px;">👋</div>
            <p style="font-weight: 700; font-size: 16px; color: var(--text); margin: 0 0 6px;">Sair da conta?</p>
            <p style="font-size: 13px; color: var(--muted); margin: 0 0 22px; line-height: 1.5;">
                Você será redirecionado para a tela de login.
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="logoutConfirmCancel" class="btn ghost" style="flex:1; max-width:130px;">Cancelar</button>
                <button id="logoutConfirmOk" class="btn primary" style="flex:1; max-width:130px;">Sair</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('#logoutConfirmCancel').onclick = close;
    overlay.querySelector('#logoutConfirmOk').onclick = () => { close(); onConfirm(); };
}
