// ============================================================
//  messages/trash.js — Lixeira de mensagens (soft delete)
// ============================================================

import {
    db, el,
    collection,
    doc, query, where
} from '../firebase.js';
import { getDocs, addDoc, updateDoc, deleteDoc, writeBatch } from '../firebase-retry.js';
import { openConfirmModal, showModal } from '../modal.js';
import { showToast } from '../toast.js';
import { escapeHtml, escapeAttr } from '../utils.js';

export function updateTrashBadge(allDocs) {
    const badge = el('trashCount');
    if (!badge) return;
    const count = allDocs.filter(d => d.deleted).length;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
}

export async function updateTrashCount(userId) {
    try {
        const snap = await getDocs(query(collection(db, 'users', userId, 'messages'), where('deleted', '==', true)));
        const count = snap.size;
        const badge = el('trashCount');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    } catch (err) { console.error("Erro ao atualizar contagem da lixeira:", err); }
}

export async function loadTrash(userId, callbacks) {
    const list = el('trashList');
    list.innerHTML = '<div class="loading-state"><span class="spinner"></span><span>Carregando lixeira...</span></div>';
    try {
        const snap = await getDocs(query(collection(db, 'users', userId, 'messages'), where('deleted', '==', true)));
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.innerHTML = docs.length ? '' : '<p class="sub center">Lixeira vazia.</p>';
        docs.forEach(item => {
            const row = document.createElement('div');
            row.className = 'user-row';
            row.innerHTML = `
                <div class="flex-1">
                    ${item.title ? `<span class="msg-title">${escapeHtml(item.title)}</span>` : ''}
                    <div>${escapeHtml(item.text)}</div>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="btn ghost btn-restore" title="Restaurar mensagem" aria-label="Restaurar mensagem: ${escapeAttr(item.title || item.text)}"><i class="fa-solid fa-undo" aria-hidden="true"></i></button>
                    <button class="btn ghost btn-delete-permanent" title="Excluir permanentemente" aria-label="Excluir permanentemente: ${escapeAttr(item.title || item.text)}"><i class="fa-solid fa-trash-can" aria-hidden="true"></i></button>
                </div>
            `;
            row.querySelector('.btn-restore').onclick = async () => {
                try {
                    await updateDoc(doc(db, 'users', userId, 'messages', item.id), { deleted: false });
                    if (callbacks?.onReload) callbacks.onReload();
                    loadTrash(userId, callbacks);
                    updateTrashCount(userId);
                } catch (err) { showModal("Erro ao restaurar a mensagem."); }
            };
            row.querySelector('.btn-delete-permanent').onclick = () => {
                openConfirmModal(
                    async () => {
                        try {
                            await deleteDoc(doc(db, 'users', userId, 'messages', item.id));
                            showToast("Mensagem excluída permanentemente!");
                            loadTrash(userId, callbacks);
                            updateTrashCount(userId);
                        } catch (err) { showModal("Erro ao excluir a mensagem."); }
                    },
                    null,
                    `Deseja realmente excluir esta mensagem permanentemente? Esta ação não poderá ser desfeita.`
                );
            };
            list.appendChild(row);
        });
    } catch (err) { console.error("Erro ao carregar lixeira:", err); }
}

export async function emptyTrash(userId, callbacks) {
    try {
        const snap = await getDocs(query(collection(db, 'users', userId, 'messages'), where('deleted', '==', true)));
        const toDelete = snap.docs;

        const BATCH_SIZE = 500;
        for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
            const batch = writeBatch(db);
            const chunk = toDelete.slice(i, i + BATCH_SIZE);
            chunk.forEach(d => batch.delete(doc(db, 'users', userId, 'messages', d.id)));
            await batch.commit();
            const processed = Math.min(i + BATCH_SIZE, toDelete.length);
            showToast(`Limpando... ${processed}/${toDelete.length}`);
        }

        showToast("Lixeira limpa!");
        updateTrashCount(userId);
        loadTrash(userId, callbacks);
    } catch (err) { showModal("Erro ao esvaziar a lixeira."); }
}
