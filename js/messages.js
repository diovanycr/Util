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
import { escapeHtml, escapeAttr } from './utils.js';
import { updateTabCounts } from './enhancements.js';

let currentUserId = null;
let dragSrc = null;
let uiInitialized = false;
let allMessages = [];
let activeCategoryFilter = null;

export function initMessages(uid) {
    currentUserId = uid;
    if (!uiInitialized) {
        setupUserInterface();
        uiInitialized = true;
    }
    loadMessages(uid);
    updateTrashCount(uid);
}

export function resetMessages() {
    uiInitialized = false;
    currentUserId = null;
    activeCategoryFilter = null;
}

function setupUserInterface() {
    // Nova mensagem
    el('btnNewMsg').onclick = () => {
        el('newMsgBox').classList.remove('hidden');
        el('msgTitle').focus();
    };

    el('btnCancelMsg').onclick = () => {
        clearMsgForm();
        el('newMsgBox').classList.add('hidden');
    };

    el('btnAddMsg').onclick = async () => {
        const text     = el('msgText').value.trim();
        const title    = el('msgTitle').value.trim();
        const category = el('msgCategory').value.trim() || 'Geral';
        if (!text) return showModal("A mensagem não pode estar vazia.");
        try {
            const snap = await getDocs(collection(db, 'users', currentUserId, 'messages'));
            const maxOrder = snap.docs.reduce((m, d) => Math.max(m, d.data().order || 0), 0);
            await addDoc(collection(db, 'users', currentUserId, 'messages'), {
                text, title, category,
                order: maxOrder + 1, deleted: false, createdAt: Date.now()
            });
            clearMsgForm();
            el('newMsgBox').classList.add('hidden');
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
        input.type = 'file'; input.accept = '.txt';
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
        () => emptyTrash(currentUserId), null,
        "Todas as mensagens da lixeira serão excluídas permanentemente."
    );
}

function clearMsgForm() {
    el('msgText').value     = '';
    el('msgTitle').value    = '';
    el('msgCategory').value = '';
}

// --- FILTRO DE CATEGORIAS ---

function updateCategoryFilterBar() {
    const bar = el('msgCategoryFilterBar');
    if (!bar) return;

    const cats = [...new Set(allMessages.map(m => m.category || 'Geral'))].sort();
    if (cats.length <= 1) { bar.classList.add('hidden'); return; }

    bar.classList.remove('hidden');
    bar.innerHTML = '<span class="tag-filter-label">Filtrar:</span>';

    const allChip = document.createElement('button');
    allChip.className = `tag-filter-chip ${!activeCategoryFilter ? 'active' : ''}`;
    allChip.textContent = 'Todas';
    allChip.onclick = () => { activeCategoryFilter = null; updateCategoryFilterBar(); renderMessages(); };
    bar.appendChild(allChip);

    cats.forEach(cat => {
        const chip = document.createElement('button');
        chip.className = `tag-filter-chip ${activeCategoryFilter === cat ? 'active' : ''}`;
        chip.textContent = cat;
        chip.onclick = () => {
            activeCategoryFilter = activeCategoryFilter === cat ? null : cat;
            updateCategoryFilterBar();
            renderMessages();
        };
        bar.appendChild(chip);
    });
}

// --- CARREGAMENTO E RENDERIZAÇÃO ---

export async function loadMessages(userId) {
    const list = el('msgList');
    if (!list) return;
    try {
        const snap = await getDocs(collection(db, 'users', userId, 'messages'));
        const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        _updateTrashBadge(allDocs);

        allMessages = allDocs
            .filter(d => !d.deleted)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        updateCategoryFilterBar();
        renderMessages();
        
        // Atualiza contador na aba
        if (typeof updateTabCounts === 'function') {
            updateTabCounts(allMessages.length);
        }
    } catch (err) {
        console.error("Erro ao carregar mensagens:", err);
    }
}

function renderMessages() {
    const list = el('msgList');
    list.innerHTML = '';

    const filtered = activeCategoryFilter
        ? allMessages.filter(m => (m.category || 'Geral') === activeCategoryFilter)
        : allMessages;

    if (filtered.length === 0) {
        list.innerHTML = '<p class="sub center">Nenhuma mensagem encontrada.</p>';
        return;
    }

    // Agrupar por categoria
    const groups = {};
    filtered.forEach(item => {
        const cat = item.category || 'Geral';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
    });

    Object.entries(groups).forEach(([category, items]) => {
        const groupEl = document.createElement('div');
        groupEl.className = 'msg-group';
        groupEl.innerHTML = `<div class="msg-group-label">${escapeHtml(category)}</div>`;

        items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'user-row';
            row.draggable = true;
            row.dataset.id = item.id;

            const titleHtml = item.title
                ? `<span class="msg-title">${escapeHtml(item.title)}</span>`
                : '';

            row.innerHTML = `
                <span class="drag-handle">&#9776;</span>
                <div class="msg-content" style="flex:1; cursor:pointer; min-width:0;">
                    ${titleHtml}
                    <div class="msg-text">${escapeHtml(item.text)}</div>
                </div>
                <button class="btn ghost btn-edit"><i class="fa-solid fa-pen"></i></button>
                <button class="btn ghost btn-del"><i class="fa-solid fa-trash"></i></button>
            `;

            // Copiar ao clicar
            row.querySelector('.msg-content').onclick = async () => {
                try {
                    await navigator.clipboard.writeText(item.text);
                    showToast("Copiado!");
                } catch (err) { console.error(err); }
            };

            // Editar
            row.querySelector('.btn-edit').onclick = () => enterEditMode(row, item, currentUserId);

            // Deletar
            row.querySelector('.btn-del').onclick = async () => {
                try {
                    await updateDoc(doc(db, 'users', currentUserId, 'messages', item.id), { deleted: true });
                    loadMessages(currentUserId);
                    updateTrashCount(currentUserId);
                } catch (err) { showModal("Erro ao mover para a lixeira."); }
            };

            // Drag
            row.ondragstart = () => { dragSrc = row; row.classList.add('dragging'); };
            row.ondragend   = () => { row.classList.remove('dragging'); saveOrder(currentUserId); };
            row.ondragover  = (e) => {
                e.preventDefault();
                const rect = row.getBoundingClientRect();
                const after = e.clientY > rect.top + rect.height / 2;
                row.parentNode.insertBefore(dragSrc, after ? row.nextSibling : row);
            };

            groupEl.appendChild(row);
        });

        list.appendChild(groupEl);
    });
}

function enterEditMode(row, item, userId) {
    const actionsHtml = `
        <button class="btn ghost btn-cancel-edit"><i class="fa-solid fa-xmark"></i></button>
        <button class="btn primary btn-save-edit"><i class="fa-solid fa-check"></i></button>
    `;
    row.innerHTML = `
        <span class="drag-handle">&#9776;</span>
        <div class="msg-edit-fields" style="flex:1; display:flex; flex-direction:column; gap:6px; min-width:0;">
            <input class="edit-msg-title"    type="text" value="${escapeAttr(item.title || '')}"    placeholder="Título (opcional)..." />
            <input class="edit-msg-category" type="text" value="${escapeAttr(item.category || '')}" placeholder="Categoria..." />
            <textarea class="edit-msg-text" rows="3">${escapeHtml(item.text)}</textarea>
        </div>
        ${actionsHtml}
    `;

    row.querySelector('.edit-msg-text').focus();

    row.querySelector('.btn-cancel-edit').onclick = () => loadMessages(userId);

    row.querySelector('.btn-save-edit').onclick = async () => {
        const newText     = row.querySelector('.edit-msg-text').value.trim();
        const newTitle    = row.querySelector('.edit-msg-title').value.trim();
        const newCategory = row.querySelector('.edit-msg-category').value.trim() || 'Geral';
        if (!newText) return showModal("A mensagem não pode estar vazia.");
        try {
            await updateDoc(doc(db, 'users', userId, 'messages', item.id), {
                text: newText, title: newTitle, category: newCategory
            });
            showToast("Mensagem atualizada!");
            loadMessages(userId);
        } catch (err) { showModal("Erro ao atualizar a mensagem."); }
    };
}

// --- IMPORTAR / EXPORTAR ---

async function importFromTxt(event, userId) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const newLines = e.target.result.split('\n').map(l => l.trim()).filter(Boolean);
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
                            await updateDoc(doc(db, 'users', userId, 'messages', existing.id), { deleted: false, updatedAt: Date.now() });
                            added++;
                        }
                    } else {
                        await addDoc(collection(db, 'users', userId, 'messages'), {
                            text: line, title: '', category: 'Geral',
                            order: 999, deleted: false, createdAt: Date.now()
                        });
                        added++;
                    }
                }
                showToast(`${added} mensagens processadas!`);
                loadMessages(userId); updateTrashCount(userId);
            };

            if (duplicates.length > 0) {
                openConfirmModal(
                    () => processImport(true), () => processImport(false),
                    `Encontramos ${duplicates.length} mensagens repetidas. Deseja substituir as existentes?`
                );
            } else { processImport(false); }
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
        a.href = URL.createObjectURL(blob); a.download = 'backup_mensagens.txt'; a.click();
        showToast("Exportado com sucesso!");
    } catch (e) { showModal("Erro ao exportar."); }
}

// --- LIXEIRA ---

async function loadTrash(userId) {
    const list = el('trashList');
    try {
        const snap = await getDocs(collection(db, 'users', userId, 'messages'));
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.deleted);
        list.innerHTML = docs.length ? '' : '<p class="sub center">Lixeira vazia.</p>';
        docs.forEach(item => {
            const row = document.createElement('div');
            row.className = 'user-row';
            row.innerHTML = `
                <div style="flex:1; min-width:0;">
                    ${item.title ? `<span class="msg-title">${escapeHtml(item.title)}</span>` : ''}
                    <div>${escapeHtml(item.text)}</div>
                </div>
                <button class="btn ghost btn-restore"><i class="fa-solid fa-undo"></i></button>
            `;
            row.querySelector('.btn-restore').onclick = async () => {
                try {
                    await updateDoc(doc(db, 'users', userId, 'messages', item.id), { deleted: false });
                    loadMessages(userId); loadTrash(userId); updateTrashCount(userId);
                } catch (err) { showModal("Erro ao restaurar a mensagem."); }
            };
            list.appendChild(row);
        });
    } catch (err) { console.error("Erro ao carregar lixeira:", err); }
}

function _updateTrashBadge(allDocs) {
    const badge = el('trashCount');
    if (!badge) return;
    const count = allDocs.filter(d => d.deleted).length;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
}

export async function updateTrashCount(userId) {
    try {
        const snap = await getDocs(collection(db, 'users', userId, 'messages'));
        _updateTrashBadge(snap.docs.map(d => d.data()));
    } catch (err) { console.error("Erro ao atualizar contagem da lixeira:", err); }
}

async function saveOrder(userId) {
    const list = el('msgList');
    const rows = [...list.querySelectorAll('.user-row')];
    try {
        const batch = writeBatch(db);
        rows.forEach((row, i) => {
            const id = row.dataset.id;
            if (id) batch.update(doc(db, 'users', userId, 'messages', id), { order: i + 1 });
        });
        await batch.commit();
    } catch (err) { console.error("Erro ao salvar ordem:", err); }
}

async function emptyTrash(userId) {
    try {
        const snap = await getDocs(collection(db, 'users', userId, 'messages'));
        const toDelete = snap.docs.filter(d => d.data().deleted);
        await Promise.all(toDelete.map(d => deleteDoc(doc(db, 'users', userId, 'messages', d.id))));
        showToast("Lixeira limpa!");
        updateTrashCount(userId); loadTrash(userId);
    } catch (err) { showModal("Erro ao esvaziar a lixeira."); }
}
