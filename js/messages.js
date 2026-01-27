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
    // Nova Mensagem
    el('btnNewMsg').onclick = () => { el('newMsgBox').classList.remove('hidden'); el('msgText').focus(); };
    el('btnCancelMsg').onclick = () => { el('msgText').value = ''; el('newMsgBox').classList.add('hidden'); };

    el('btnAddMsg').onclick = async () => {
        const text = el('msgText').value.trim();
        if (!text) return showModal("A mensagem não pode estar vazia.");
        try {
            const snap = await getDocs(collection(db, 'users', currentUserId, 'messages'));
            const maxOrder = snap.docs.reduce((m, d) => Math.max(m, d.data().order || 0), 0);
            await addDoc(collection(db, 'users', currentUserId, 'messages'), {
                text, order: maxOrder + 1, deleted: false, createdAt: Date.now()
            });
            el('msgText').value = ''; el('newMsgBox').classList.add('hidden');
            loadMessages(currentUserId);
        } catch (e) { console.error(e); }
    };

    // Exportar / Importar
    el('btnExport').onclick = () => exportToTxt(currentUserId);
    el('btnImport').onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';
        input.onchange = (e) => importFromTxt(e, currentUserId);
        input.click();
    };

    // Lixeira
    el('btnTrashToggle').onclick = () => {
        const isHidden = el('trashBox').classList.toggle('hidden');
        if (!isHidden) loadTrash(currentUserId);
    };
    el('btnCancelTrash').onclick = () => el('trashBox').classList.add('hidden');
    el('btnEmptyTrash').onclick = () => openConfirmModal(() => emptyTrash(currentUserId));
}

// --- LOGICA DE IMPORTAÇÃO COM VERIFICAÇÃO DE DUPLICATAS ---

async function importFromTxt(event, userId) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const content = e.target.result;
            const newLines = content.split('\n').map(l => l.trim()).filter(l => l !== "");
            if (newLines.length === 0) return showModal("O arquivo está vazio.");

            const snap = await getDocs(collection(db, 'users', userId, 'messages'));
            const existingItems = snap.docs.map(d => ({ id: d.id, text: d.data().text }));
            
            // Filtra o que já existe no banco
            const duplicates = newLines.filter(line => existingItems.some(ext => ext.text === line));

            const processImport = async (replaceDuplicates) => {
                let added = 0;
                for (const line of newLines) {
                    const existing = existingItems.find(ext => ext.text === line);
                    
                    if (existing) {
                        if (replaceDuplicates) {
                            // "Substituir" aqui significa garantir que ela não está deletada e atualizar o timestamp
                            await updateDoc(doc(db, 'users', userId, 'messages', existing.id), {
                                deleted: false,
                                updatedAt: Date.now()
                            });
                            added++;
                        }
                    } else {
                        await addDoc(collection(db, 'users', userId, 'messages'), {
                            text: line, order: 999, deleted: false, createdAt: Date.now()
                        });
                        added++;
                    }
                }
                showToast(`${added} mensagens processadas!`);
                loadMessages(userId);
                updateTrashCount(userId);
            };

            if (duplicates.length > 0) {
                // Se houver duplicatas, pergunta o que fazer
                // Ajustamos o texto do modal dinamicamente se necessário
                const confirmP = document.querySelector('#confirmModal .sub');
                if (confirmP) confirmP.innerText = `Encontramos ${duplicates.length} mensagens repetidas. Deseja substituir as existentes? (Se cancelar, apenas as novas serão ignoradas)`;

                openConfirmModal(
                    () => processImport(true),  // Confirmar: Substitui
                    () => processImport(false)  // Cancelar: Apenas adiciona as inéditas
                );
            } else {
                processImport(false);
            }
        } catch (err) { showModal("Erro ao ler o arquivo .txt"); }
    };
    reader.readAsText(file);
}

async function exportToTxt(userId) {
    try {
        const snap = await getDocs(collection(db, 'users', userId, 'messages'));
        const lines = snap.docs.map(d => d.data()).filter(d => !d.deleted).map(d => d.text);
        if (lines.length === 0) return showModal("Não há mensagens para exportar.");
        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `backup_mensagens.txt`;
        a.click();
        showToast("Exportado com sucesso!");
    } catch (e) { showModal("Erro ao exportar."); }
}

// --- FUNÇÕES DE CARREGAMENTO E UI ---

export async function loadMessages(userId) {
    const list = el('msgList');
    if (!list) return;
    const snap = await getDocs(collection(db, 'users', userId, 'messages'));
    list.innerHTML = '';
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(d => !d.deleted).sort((a, b) => (a.order || 0) - (b.order || 0));

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
        row.querySelector('.btn-del').onclick = async () => {
            await updateDoc(doc(db, 'users', userId, 'messages', item.id), { deleted: true });
            loadMessages(userId); updateTrashCount(userId);
        };
        
        // Drag events
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
}

async function loadTrash(userId) {
    const list = el('trashList');
    const snap = await getDocs(collection(db, 'users', userId, 'messages'));
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.deleted);
    list.innerHTML = docs.length ? '' : '<p class="sub center">Lixeira vazia.</p>';
    docs.forEach(item => {
        const row = document.createElement('div');
        row.className = 'user-row';
        row.innerHTML = `<div style="flex:1">${item.text}</div><button class="btn ghost btn-restore"><i class="fa-solid fa-undo"></i></button>`;
        row.querySelector('.btn-restore').onclick = async () => {
            await updateDoc(doc(db, 'users', userId, 'messages', item.id), { deleted: false });
            loadMessages(userId); loadTrash(userId); updateTrashCount(userId);
        };
        list.appendChild(row);
    });
}

async function saveOrder(userId) {
    const rows = [...el('msgList').children];
    for (let i = 0; i < rows.length; i++) {
        const id = rows[i].dataset.id;
        if (id) await updateDoc(doc(db, 'users', userId, 'messages', id), { order: i + 1 });
    }
}

async function emptyTrash(userId) {
    const snap = await getDocs(collection(db, 'users', userId, 'messages'));
    const toDelete = snap.docs.filter(d => d.data().deleted);
    await Promise.all(toDelete.map(d => deleteDoc(doc(db, 'users', userId, 'messages', d.id))));
    showToast("Lixeira limpa!");
    updateTrashCount(userId); loadTrash(userId);
}

async function updateTrashCount(userId) {
    const badge = el('trashCount');
    const snap = await getDocs(collection(db, 'users', userId, 'messages'));
    const count = snap.docs.filter(d => d.data().deleted).length;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
}

function showToast(message) {
    const old = document.querySelector('.toast-success');
    if (old) old.remove();
    const t = document.createElement('div');
    t.className = 'toast-success';
    t.innerText = message;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 500); }, 2000);
}
