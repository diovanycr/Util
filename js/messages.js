import { 
    db, el,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    writeBatch
} from './firebase.js';

import { openConfirmModal, showModal } from './modal.js';
import { showToast } from './toast.js';

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
        } catch (e) {
            console.error("Erro ao adicionar mensagem:", e);
            showModal("Erro ao salvar a mensagem.");
        }
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
    el('btnEmptyTrash').onclick = () => openConfirmModal(
        () => emptyTrash(currentUserId),
        null,
        "Todas as mensagens da lixeira serão excluídas permanentemente."
    );
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
            
            const duplicates = newLines.filter(line => existingItems.some(ext => ext.text === line));

            const processImport = async (replaceDuplicates) => {
                let added = 0;
                for (const line of newLines) {
                    const existing = existingItems.find(ext => ext.text === line);
                    
                    if (existing) {
                        if (replaceDuplicates) {
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
                openConfirmModal(
                    () => processImport(true),
                    () => processImport(false),
                    `Encontramos ${duplicates.length} mensagens repetidas. Deseja substituir as existentes? (Se cancelar, apenas as novas serão adicionadas)`
                );
            } else {
                processImport(false);
            }
        } catch (err) {
            console.error("Erro na importação:", err);
            showModal("Erro ao ler o arquivo .txt");
        }
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
    } catch (e) {
        console.error("Erro ao exportar:", e);
        showModal("Erro ao exportar.");
    }
}

// --- FUNÇÕES DE CARREGAMENTO E UI ---

export async function loadMessages(userId) {
    const list = el('msgList');
    if (!list) return;
    
    try {
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
                <button class="btn ghost btn-edit"><i class="fa-solid fa-pen"></i></button>
                <button class="btn ghost btn-del"><i class="fa-solid fa-trash"></i></button>
            `;
            row.querySelector('.msg-text').onclick = async () => {
                try {
                    await navigator.clipboard.writeText(item.text);
                    showToast("Copiado!");
                } catch (err) {
                    console.error("Erro ao copiar:", err);
                }
            };
            row.querySelector('.btn-edit').onclick = () => {
                const msgDiv = row.querySelector('.msg-text');
                const oldText = item.text;
                const textarea = document.createElement('textarea');
                textarea.value = oldText;
                textarea.rows = 3;
                textarea.style.flex = '1';
                msgDiv.replaceWith(textarea);
                textarea.focus();

                row.querySelector('.btn-edit').classList.add('hidden');
                row.querySelector('.btn-del').classList.add('hidden');
                const saveBtn = document.createElement('button');
                saveBtn.className = 'btn primary btn-save';
                saveBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'btn ghost btn-cancel-edit';
                cancelBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                row.appendChild(cancelBtn);
                row.appendChild(saveBtn);

                saveBtn.onclick = async () => {
                    const newText = textarea.value.trim();
                    if (!newText) return showModal("A mensagem não pode estar vazia.");
                    if (newText !== oldText) {
                        try {
                            await updateDoc(doc(db, 'users', userId, 'messages', item.id), { text: newText });
                            showToast("Mensagem atualizada!");
                        } catch (err) {
                            console.error("Erro ao atualizar:", err);
                            showModal("Erro ao atualizar a mensagem.");
                        }
                    }
                    loadMessages(userId);
                };
                cancelBtn.onclick = () => loadMessages(userId);
            };
            row.querySelector('.btn-del').onclick = async () => {
                try {
                    await updateDoc(doc(db, 'users', userId, 'messages', item.id), { deleted: true });
                    loadMessages(userId); 
                    updateTrashCount(userId);
                } catch (err) {
                    console.error("Erro ao deletar:", err);
                    showModal("Erro ao mover para a lixeira.");
                }
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
    } catch (err) {
        console.error("Erro ao carregar mensagens:", err);
    }
}

async function loadTrash(userId) {
    const list = el('trashList');
    try {
        const snap = await getDocs(collection(db, 'users', userId, 'messages'));
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.deleted);
        list.innerHTML = docs.length ? '' : '<p class="sub center">Lixeira vazia.</p>';
        docs.forEach(item => {
            const row = document.createElement('div');
            row.className = 'user-row';
            row.innerHTML = `<div style="flex:1">${item.text}</div><button class="btn ghost btn-restore"><i class="fa-solid fa-undo"></i></button>`;
            row.querySelector('.btn-restore').onclick = async () => {
                try {
                    await updateDoc(doc(db, 'users', userId, 'messages', item.id), { deleted: false });
                    loadMessages(userId); loadTrash(userId); updateTrashCount(userId);
                } catch (err) {
                    console.error("Erro ao restaurar:", err);
                    showModal("Erro ao restaurar a mensagem.");
                }
            };
            list.appendChild(row);
        });
    } catch (err) {
        console.error("Erro ao carregar lixeira:", err);
    }
}

/**
 * ✅ MELHORIA: Usa writeBatch ao invés de N chamadas sequenciais
 */
async function saveOrder(userId) {
    const rows = [...el('msgList').children];
    try {
        const batch = writeBatch(db);
        rows.forEach((row, i) => {
            const id = row.dataset.id;
            if (id) {
                batch.update(doc(db, 'users', userId, 'messages', id), { order: i + 1 });
            }
        });
        await batch.commit();
    } catch (err) {
        console.error("Erro ao salvar ordem:", err);
    }
}

async function emptyTrash(userId) {
    try {
        const snap = await getDocs(collection(db, 'users', userId, 'messages'));
        const toDelete = snap.docs.filter(d => d.data().deleted);
        await Promise.all(toDelete.map(d => deleteDoc(doc(db, 'users', userId, 'messages', d.id))));
        showToast("Lixeira limpa!");
        updateTrashCount(userId); loadTrash(userId);
    } catch (err) {
        console.error("Erro ao esvaziar lixeira:", err);
        showModal("Erro ao esvaziar a lixeira.");
    }
}

async function updateTrashCount(userId) {
    try {
        const badge = el('trashCount');
        const snap = await getDocs(collection(db, 'users', userId, 'messages'));
        const count = snap.docs.filter(d => d.data().deleted).length;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    } catch (err) {
        console.error("Erro ao atualizar contagem da lixeira:", err);
    }
}
