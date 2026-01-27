import { db, el } from './firebase.js';
import { 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { openConfirmModal, showModal } from './modal.js';

let currentUserId = null;
let dragSrc = null;

/**
 * Inicializa a área de mensagens
 */
export function initMessages(uid) {
    currentUserId = uid;
    loadMessages(uid);
    updateTrashCount(uid);
    setupUserInterface();
}

/**
 * Configura os botões e eventos
 */
function setupUserInterface() {
    // Nova Mensagem
    el('btnNewMsg').onclick = () => {
        el('newMsgBox').classList.remove('hidden');
        el('msgText').focus();
    };

    el('btnCancelMsg').onclick = () => {
        el('msgText').value = '';
        el('newMsgBox').classList.add('hidden');
    };

    el('btnAddMsg').onclick = async () => {
        const text = el('msgText').value.trim();
        if (!text) return showModal("A mensagem não pode estar vazia.");
        try {
            const snap = await getDocs(collection(db, 'users', currentUserId, 'messages'));
            const maxOrder = snap.docs.reduce((m, d) => Math.max(m, d.data().order || 0), 0);
            await addDoc(collection(db, 'users', currentUserId, 'messages'), {
                text,
                order: maxOrder + 1,
                deleted: false,
                createdAt: Date.now()
            });
            el('msgText').value = '';
            el('newMsgBox').classList.add('hidden');
            loadMessages(currentUserId);
        } catch (e) { console.error("Erro ao salvar:", e); }
    };

    // CONTROLE DA LIXEIRA
    el('btnTrashToggle').onclick = () => {
        const isHidden = el('trashBox').classList.toggle('hidden');
        if (!isHidden) {
            loadTrash(currentUserId); // CARREGA AO ABRIR
        }
    };

    el('btnCancelTrash').onclick = () => el('trashBox').classList.add('hidden');

    el('btnEmptyTrash').onclick = () => {
        openConfirmModal(async () => {
            await emptyTrash(currentUserId);
        });
    };
}

/**
 * Carrega mensagens ativas
 */
export async function loadMessages(userId) {
    const list = el('msgList');
    if (!list) return;

    try {
        const snap = await getDocs(collection(db, 'users', userId, 'messages'));
        list.innerHTML = '';
        
        const docs = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(d => !d.deleted)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        if (docs.length === 0) {
            list.innerHTML = '<p class="sub center">Nenhuma mensagem ativa.</p>';
            return;
        }

        docs.forEach(item => {
            const row = document.createElement('div');
            row.className = 'user-row';
            row.draggable = true;
            row.dataset.id = item.id;
            row.innerHTML = `
                <span class="drag-handle">&#9776;</span>
                <div class="msg-text" style="flex:1; cursor:pointer">${item.text}</div>
                <button class="btn danger btn-del"><i class="fa-solid fa-trash"></i></button>
            `;

            // Clique para Copiar
            row.querySelector('.msg-text').onclick = async () => {
                await navigator.clipboard.writeText(item.text);
                showToast("Copiado!");
            };

            // Mover para lixeira
            row.querySelector('.btn-del').onclick = async () => {
                await updateDoc(doc(db, 'users', userId, 'messages', item.id), { 
                    deleted: true,
                    deletedAt: Date.now() 
                });
                loadMessages(userId);
                updateTrashCount(userId);
            };

            // Drag & Drop
            row.ondragstart = () => { dragSrc = row; row.classList.add('dragging'); };
            row.ondragend = () => { row.classList.remove('dragging'); saveOrder(userId); };
            row.ondragover = (e) => {
                e.preventDefault();
                const rect = row.getBoundingClientRect();
                const next = (e.clientY > rect.top + rect.height / 2);
                list.insertBefore(dragSrc, next ? row.nextSibling : row);
            };

            list.appendChild(row);
        });
    } catch (e) { console.error("Erro ao carregar mensagens:", e); }
}

/**
 * Carrega mensagens excluídas (Lixeira)
 */
async function loadTrash(userId) {
    const list = el('trashList');
    if (!list) return;

    list.innerHTML = '<p class="sub center">Carregando...</p>';
    
    try {
        const snap = await getDocs(collection(db, 'users', userId, 'messages'));
        const deletedDocs = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(d => d.deleted === true);

        list.innerHTML = '';

        if (deletedDocs.length === 0) {
            list.innerHTML = '<p class="sub center">A lixeira está vazia.</p>';
            return;
        }

        deletedDocs.forEach(item => {
            const row = document.createElement('div');
            row.className = 'user-row';
            row.style.background = '#f9fafb';
            row.innerHTML = `
                <div style="flex:1; font-size: 14px; color: #6b7280;">${item.text}</div>
                <button class="btn ghost btn-restore" title="Restaurar">
                    <i class="fa-solid fa-rotate-left"></i>
                </button>
            `;
            
            row.querySelector('.btn-restore').onclick = async () => {
                await updateDoc(doc(db, 'users', userId, 'messages', item.id), { 
                    deleted: false 
                });
                loadMessages(userId);
                loadTrash(userId);
                updateTrashCount(userId);
                showToast("Mensagem restaurada!");
            };

            list.appendChild(row);
        });
    } catch (e) { console.error("Erro na lixeira:", e); }
}

/**
 * Salva nova ordem das mensagens
 */
async function saveOrder(userId) {
    const rows = [...el('msgList').children];
    for (let i = 0; i < rows.length; i++) {
        const id = rows[i].dataset.id;
        if (id) {
            await updateDoc(doc(db, 'users', userId, 'messages', id), { order: i + 1 });
        }
    }
}

/**
 * Esvazia a lixeira (Exclusão Permanente)
 */
async function emptyTrash(userId) {
    try {
        const snap = await getDocs(collection(db, 'users', userId, 'messages'));
        const toDelete = snap.docs.filter(d => d.data().deleted);
        
        if (toDelete.length === 0) return;

        await Promise.all(toDelete.map(d => deleteDoc(doc(db, 'users', userId, 'messages', d.id))));
        
        showToast("Lixeira limpa!");
        updateTrashCount(userId);
        loadTrash(userId);
    } catch (e) { console.error("Erro ao esvaziar:", e); }
}

/**
 * Atualiza o contador visual
 */
async function updateTrashCount(userId) {
    const badge = el('trashCount');
    if (!badge) return;
    const snap = await getDocs(collection(db, 'users', userId, 'messages'));
    const count = snap.docs.filter(d => d.data().deleted).length;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
}

/**
 * Feedback Toast
 */
function showToast(message) {
    const old = document.querySelector('.toast-success');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-success';
    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 2000);
}
