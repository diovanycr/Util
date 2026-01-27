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

export function initMessages(uid) {
    currentUserId = uid;
    loadMessages(uid);
    updateTrashCount(uid);
    setupUserInterface();
}

function setupUserInterface() {
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
        } catch (e) { console.error(e); }
    };

    // BOTÃO VER LIXEIRA
    el('btnTrashToggle').onclick = () => {
        const isHidden = el('trashBox').classList.toggle('hidden');
        if (!isHidden) {
            loadTrash(currentUserId); // Carrega os itens quando abrir
        }
    };

    el('btnCancelTrash').onclick = () => el('trashBox').classList.add('hidden');

    el('btnEmptyTrash').onclick = () => {
        openConfirmModal(async () => {
            await emptyTrash(currentUserId);
        });
    };
}

// MENSAGENS ATIVAS
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
            row.querySelector('.msg-text').onclick = async () => {
                await navigator.clipboard.writeText(item.text);
                showToast("Copiado!");
            };
            row.querySelector('.btn-del').onclick = () => {
                // Aqui não precisa confirmar, pois vai para a lixeira
                moveToTrash(item.id);
            };
            // Drag events... (omitidos para brevidade, mas mantenha os seus)
            list.appendChild(row);
        });
    } catch (e) { console.error(e); }
}

// --- NOVA FUNÇÃO: CARREGAR ITENS DA LIXEIRA ---
async function loadTrash(userId) {
    const list = el('trashList');
    if (!list) return;
    list.innerHTML = '<p class="sub">Carregando lixeira...</p>';
    
    const snap = await getDocs(collection(db, 'users', userId, 'messages'));
    const deletedDocs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(d => d.deleted);

    list.innerHTML = '';
    if (deletedDocs.length === 0) {
        list.innerHTML = '<p class="sub center">A lixeira está vazia.</p>';
        return;
    }

    deletedDocs.forEach(item => {
        const row = document.createElement('div');
        row.className = 'user-row';
        row.style.background = '#fff5f5';
        row.innerHTML = `
            <div style="flex:1; color:#666">${item.text}</div>
            <button class="btn ghost btn-restore" title="Restaurar"><i class="fa-solid fa-undo"></i></button>
        `;
        
        // Restaurar mensagem
        row.querySelector('.btn-restore').onclick = async () => {
            await updateDoc(doc(db, 'users', userId, 'messages', item.id), { deleted: false });
            loadMessages(userId);
            loadTrash(userId);
            updateTrashCount(userId);
        };
        list.appendChild(row);
    });
}

async function moveToTrash(msgId) {
    await updateDoc(doc(db, 'users', currentUserId, 'messages', msgId), { 
        deleted: true,
        deletedAt: Date.now() 
    });
    loadMessages(currentUserId);
    updateTrashCount(currentUserId);
}

async function emptyTrash(userId) {
    const snap = await getDocs(collection(db, 'users', userId, 'messages'));
    const toDelete = snap.docs.filter(d => d.data().deleted);
    await Promise.all(toDelete.map(d => deleteDoc(doc(db, 'users', userId, 'messages', d.id))));
    showToast("Lixeira esvaziada!");
    updateTrashCount(userId);
    loadTrash(userId);
}

async function updateTrashCount(userId) {
    const badge = el('trashCount');
    const snap = await getDocs(collection(db, 'users', userId, 'messages'));
    const count = snap.docs.filter(d => d.data().deleted).length;
    badge.textContent = count;
}

function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast-success';
    t.innerText = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
}
