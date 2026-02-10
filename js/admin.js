import { 
    db, el, secondaryAuth, auth,
    collection,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    setDoc,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail
} from './firebase.js';

import { showModal, openConfirmModal } from './modal.js';
import { showToast } from './toast.js';

export async function loadUsers() {
    const userList = el('userList');
    if (!userList) return;
    
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

            const isBlocked = u.blocked === true;
            const row = document.createElement('div');
            
            row.className = 'user-row' + (isBlocked ? ' blocked' : '');
            
            const isGoogle = u.provider === 'google';
            
            row.innerHTML = `
                <div style="display:flex;align-items:center;gap:12px;">
                    ${isGoogle && u.photoURL ? `<img src="${u.photoURL}" class="user-avatar" referrerpolicy="no-referrer" />` : ''}
                    <div>
                        <strong>${u.username}</strong> 
                        ${isBlocked ? '<span class="status-badge-blocked">Bloqueado</span>' : ''}
                        ${isGoogle ? '<span class="status-badge-google"><i class="fa-brands fa-google"></i> Google</span>' : ''}
                        <br>
                        <span class="sub">${u.email}</span>
                    </div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <button class="btn ghost btnBlock">${isBlocked ? 'Desbloquear' : 'Bloquear'}</button>
                    
                    ${!isGoogle ? `
                    <button class="btn ghost btnReset" title="Resetar Senha">
                        <i class="fa-solid fa-key"></i>
                    </button>
                    ` : ''}

                    <button class="btn ghost btnDelete"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;

            // Reset de senha
            const btnReset = row.querySelector('.btnReset');
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
            row.querySelector('.btnBlock').onclick = async () => {
                try {
                    await updateDoc(doc(db, 'users', d.id), { blocked: !isBlocked });
                    showToast(isBlocked ? "Usuário desbloqueado!" : "Usuário bloqueado!");
                    loadUsers();
                } catch (err) {
                    console.error("Erro ao alterar bloqueio:", err);
                    showModal("Erro ao alterar status do usuário.");
                }
            };

            // Excluir
            row.querySelector('.btnDelete').onclick = () => {
                openConfirmModal(
                    async () => {
                        try {
                            const msgsSnap = await getDocs(collection(db, 'users', d.id, 'messages'));
                            const probsSnap = await getDocs(collection(db, 'users', d.id, 'problems'));
                            
                            const deletePromises = [
                                ...msgsSnap.docs.map(m => deleteDoc(doc(db, 'users', d.id, 'messages', m.id))),
                                ...probsSnap.docs.map(p => deleteDoc(doc(db, 'users', d.id, 'problems', p.id)))
                            ];
                            await Promise.all(deletePromises);
                            
                            await deleteDoc(doc(db, 'users', d.id));
                            showToast("Usuário excluído!");
                            loadUsers();
                        } catch (err) {
                            console.error("Erro ao excluir:", err);
                            showModal("Erro ao excluir o usuário.");
                        }
                    },
                    null,
                    `Deseja realmente excluir "${u.username}"? Todas as mensagens e problemas serão perdidos.`
                );
            };

            userList.appendChild(row);
        });
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

        try {
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
