import {
    db, el, secondaryAuth, auth,
    collection,
    doc,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    query,
    where,
    orderBy,
    limit,
    startAfter
} from '../core/firebase.js';
import { getDocs, updateDoc, deleteDoc, setDoc, writeBatch } from '../core/firebase-retry.js';

import { showModal, openConfirmModal } from '../core/modal.js';
import { showToast } from '../core/toast.js';
import { escapeHtml, escapeAttr, withButtonLoading } from '../core/utils.js';

let _lastUserDoc = null;
const PAGE_SIZE = 50;

export async function loadUsers(append = false) {
    const userList = el('userList');
    if (!userList) return;

    if (!append) {
        userList.innerHTML = '<p class="sub">Carregando usuários...</p>';
        _lastUserDoc = null;
    }

    try {
        let q = query(collection(db, 'users'), orderBy('username'), limit(PAGE_SIZE));
        if (_lastUserDoc) q = query(collection(db, 'users'), orderBy('username'), startAfter(_lastUserDoc), limit(PAGE_SIZE));

        const snap = await getDocs(q);

        if (snap.empty && !append) {
            userList.innerHTML = '<p class="sub">Nenhum usuário cadastrado.</p>';
            return;
        }

        if (snap.empty && append) {
            showToast("Não há mais usuários.");
            return;
        }

        if (!append) userList.innerHTML = '';

        _lastUserDoc = snap.docs[snap.docs.length - 1];

        snap.forEach(d => {
            const u = d.data();
            if (u.role === 'admin') return;

            const isBlocked = u.blocked === true;
            const row = document.createElement('div');
            
            row.className = 'user-row' + (isBlocked ? ' blocked' : '');
            
            const isGoogle = u.provider === 'google';
            
            const safeUsername = escapeHtml(u.username || '');
            const safeEmail = escapeHtml(u.email || '');
            const safePhoto = u.photoURL && /^https:\/\//i.test(u.photoURL)
                ? escapeAttr(u.photoURL)
                : '';

            row.innerHTML = `
                <div style="display:flex;align-items:center;gap:12px;">
                    ${isGoogle && safePhoto ? `<img src="${safePhoto}" class="user-avatar" referrerpolicy="no-referrer" alt="" />` : ''}
                    <div>
                        <strong>${safeUsername}</strong> 
                        ${isBlocked ? '<span class="status-badge-blocked">Bloqueado</span>' : ''}
                        ${isGoogle ? '<span class="status-badge-google"><i class="fa-brands fa-google"></i> Google</span>' : ''}
                        <br>
                        <span class="sub">${safeEmail}</span>
                    </div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <button class="btn ghost btnBlock">${isBlocked ? 'Desbloquear' : 'Bloquear'}</button>
                    
                    ${!isGoogle ? `
                    <button class="btn ghost btnReset" title="Resetar Senha" aria-label="Resetar senha de ${escapeAttr(u.username || '')}">
                        <i class="fa-solid fa-key" aria-hidden="true"></i>
                    </button>
                    ` : ''}

                    <button class="btn ghost btnDelete" aria-label="Excluir usuário ${escapeAttr(u.username || '')}"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>
                </div>
            `;

            // Reset de senha
            const btnReset = /** @type {HTMLElement|null} */ (row.querySelector('.btnReset'));
            if (btnReset) {
                btnReset.onclick = () => {
                    openConfirmModal(
                        async () => {
                            try {
                                await sendPasswordResetEmail(auth, u.email);
                                showToast("E-mail de redefinição enviado!");
                            } catch (err) {
                                console.error("Erro no reset:", err);
                                showModal("Erro ao enviar e-mail de recuperação.");
                            }
                        },
                        null,
                        `Enviar e-mail de redefinição de senha para ${u.email}?`
                    );
                };
            }

            // Bloquear/Desbloquear
            const btnBlock = /** @type {HTMLElement|null} */ (row.querySelector('.btnBlock'));
            if (btnBlock) {
                btnBlock.onclick = async () => {
                    try {
                        await updateDoc(doc(db, 'users', d.id), { blocked: !isBlocked });
                        showToast(isBlocked ? "Usuário desbloqueado!" : "Usuário bloqueado!");
                        loadUsers();
                    } catch (err) {
                        console.error("Erro ao alterar bloqueio:", err);
                        showModal("Erro ao alterar status do usuário.");
                    }
                };
            }

            // Excluir
            const btnDelete = /** @type {HTMLElement|null} */ (row.querySelector('.btnDelete'));
            if (btnDelete) {
                btnDelete.onclick = () => {
                    openConfirmModal(
                        async () => {
                            try {
                                // Busca e remove cada subcoleção em páginas para não estourar a memória
                                const SUBCOL_PAGE = 500;
                                const subcols = ['messages', 'problems', 'links'];
                                for (const sub of subcols) {
                                    for (;;) {
                                        const page = await getDocs(query(collection(db, 'users', d.id, sub), limit(SUBCOL_PAGE)));
                                        if (page.empty) break;
                                        const batch = writeBatch(db);
                                        page.docs.forEach(docSnap => batch.delete(doc(db, 'users', d.id, sub, docSnap.id)));
                                        await batch.commit();
                                        if (page.docs.length < SUBCOL_PAGE) break;
                                    }
                                }

                                await deleteDoc(doc(db, 'users', d.id));
                                showToast("Usuário excluído!");
                                loadUsers();
                            } catch (err) {
                                console.error("Erro ao excluir:", err);
                                showModal("Erro ao excluir o usuário.");
                            }
                        },
                        null,
                        `Deseja realmente excluir "${u.username}"? Todas as mensagens, problemas e links do Firestore serão removidos. Nota: Para liberar o e-mail no Firebase Auth, remova o usuário também pelo Console Firebase.`
                    );
                };
            }

            userList.appendChild(row);
        });

        // Botão "Carregar mais" se houver mais registros
        if (snap.docs.length === PAGE_SIZE) {
            const loadMoreBtn = document.createElement('div');
            loadMoreBtn.style.cssText = 'display:flex;justify-content:center;margin-top:12px;';
            loadMoreBtn.innerHTML = '<button class="btn ghost" id="btnLoadMoreUsers"><i class="fa-solid fa-chevron-down"></i> Carregar mais usuários</button>';
            userList.appendChild(loadMoreBtn);
            const btnMore = /** @type {HTMLElement|null} */ (loadMoreBtn.querySelector('#btnLoadMoreUsers'));
            if (btnMore) btnMore.onclick = () => { loadMoreBtn.remove(); loadUsers(true); };
        }
    } catch (e) {
        console.error("Erro ao carregar lista:", e);
        userList.innerHTML = '<p class="sub">Erro ao carregar usuários.</p>';
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

        // Validar unicidade de username/email no Firestore antes de criar
        try {
            const userQ = query(collection(db, 'users'), where('username', '==', username));
            const userSnap = await getDocs(userQ);
            if (!userSnap.empty) {
                showModal("Este nome de usuário já está em uso. Escolha outro.");
                return;
            }
            const emailQ = query(collection(db, 'users'), where('email', '==', email));
            const emailSnap = await getDocs(emailQ);
            if (!emailSnap.empty) {
                showModal("Este e-mail já está cadastrado. Use outro e-mail.");
                return;
            }
        } catch (e) {
            console.warn("Falha ao validar unicidade (pode ser erro de rede):", e);
        }

        try {
            await withButtonLoading(btn, async () => {
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

            }, 'Criando...');

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
