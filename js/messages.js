import { db, el } from './firebase.js';
import { 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    doc, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { openConfirmModal, showModal } from './modal.js';

let currentUserId = null;
let dragSrc = null;

/**
 * Inicializa a área de mensagens do usuário
 */
export function initMessages(uid) {
    currentUserId = uid;
    loadMessages(uid);
    updateTrashCount(uid);
    setupUserInterface();
}

/**
 * Configura os botões da interface do usuário
 */
function setupUserInterface() {
    // Abrir/Fechar box de nova mensagem
    el('btnNewMsg').onclick = () => {
        el('newMsgBox').classList.remove('hidden');
        el('msgText').focus();
    };

    el('btnCancelMsg').onclick = () => {
        el('msgText').value = '';
        el('newMsgBox').classList.add('hidden');
    };

    // Salvar nova mensagem
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
        } catch (e) {
            console.error("Erro ao salvar mensagem:", e);
        }
    };

    // Toggle da Lixeira (Ações rápidas)
    el('btnTrashToggle').onclick = () => {
        const trashActions = el('trashActions');
        if (trashActions) trashActions.classList.toggle('hidden');
    };
}

/**
 * Carrega e renderiza as mensagens ativas
 */
export async function loadMessages(userId) {
    const list = el('msgList');
    if (!list) return;

    list.innerHTML = '<p class="sub">Carregando mensagens...</p>';
    
    try {
        const snap = await getDocs(collection(db, 'users', userId, 'messages'));
        list.innerHTML = '';

        const docs = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(d => !d.deleted)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        if (docs.length === 0) {
            list.innerHTML = '<p class="sub center">Nenhuma mensagem cadastrada.</p>';
            return;
        }

        docs.forEach(item => {
            const row = document.createElement('div');
            row.className = 'user-row';
            row.draggable = true;
            row.dataset.id = item.id;

            row.innerHTML = `
                <span class="drag-handle" title="Arraste para reordenar">&#9776;</span>
                <div class="msg-text" style="flex:1; cursor:pointer" title="Clique para copiar">${item.text}</div>
                <button class="btn danger btn-del" title="Excluir"><i class="fa-solid fa-trash"></i></button>
            `;

            // EVENTO: COPIAR (Com Toast)
            row.querySelector('.msg-text').onclick = async () => {
                try {
                    await navigator.clipboard.writeText(item.text);
                    showToast("Copiado com sucesso!");
                } catch (err) {
                    showModal("Erro ao copiar para a área de transferência.");
                }
            };

            // EVENTO: EXCLUIR (Com Modal de Confirmação)
            row.querySelector('.btn-del').onclick = () => {
                openConfirmModal(async () => {
                    await updateDoc(doc(db, 'users', userId, 'messages', item.id), { 
                        deleted: true,
                        deletedAt: Date.now()
                    });
                    loadMessages(userId);
                    updateTrashCount(userId);
                });
            };

            // EVENTOS: DRAG & DROP
            row.ondragstart = () => { dragSrc = row; row.style.opacity = '0.5'; };
            row.ondragend = () => { row.style.opacity = '1'; saveOrder(userId); };
            row.ondragover = (e) => {
                e.preventDefault();
                const rect = row.getBoundingClientRect();
                const next = (e.clientY > rect.top + rect.height / 2);
                list.insertBefore(dragSrc, next ? row.nextSibling : row);
            };

            list.appendChild(row);
        });
    } catch (e) {
        console.error("Erro ao carregar mensagens:", e);
    }
}

/**
 * Salva a nova ordem das mensagens após o Drag & Drop
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
 * Atualiza o contador de itens na lixeira
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
 * Função de Feedback Visual (Toast)
 */
function showToast(message) {
    // Remove toast antigo se houver
    const oldToast = document.querySelector('.toast-success');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-success';
    toast.innerText = message;
    document.body.appendChild(toast);

    // Fade out e remoção
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 2000);
}
