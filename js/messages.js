// ============================================================
//  messages.js — Orquestrador do módulo de mensagens
// ============================================================
//  Ponto de entrada público (auth.js, search.js). A lógica foi
//  dividida em submódulos sob js/messages/:
//    • state.js        — estado compartilhado (allMessages, flags)
//    • loader.js       — carregamento, renderização, edição, reorder
//    • import-export.js — importar/exportar TXT e JSON
//    • trash.js         — lixeira (loadTrash, emptyTrash, contagem)

import { el, db, collection, getDocs, addDoc, doc, query, orderBy, limit } from './firebase.js';
import { showModal, openConfirmModal } from './modal.js';
import { initHistory } from './history.js';

import { state, allMessages, resetState } from './messages/state.js';
import {
    loadMessages,
    renderMessages,
    saveOrder
} from './messages/loader.js';
import {
    importFromTxt,
    exportToTxt,
    exportToJson
} from './messages/import-export.js';
import {
    loadTrash,
    emptyTrash,
    updateTrashCount
} from './messages/trash.js';

export {
    allMessages,
    loadMessages,
    updateTrashCount
};

let onMessagesWindowFocus = null;

export function initMessages(uid) {
    state.currentUserId = uid;
    if (!state.uiInitialized) {
        setupUserInterface(uid);
        setupAutoTimeRefresh();
        state.uiInitialized = true;
    }
    loadMessages(uid);
    updateTrashCount(uid);
    initHistory(uid);
}

export function resetMessages() {
    if (onMessagesWindowFocus) {
        window.removeEventListener('focus', onMessagesWindowFocus);
        onMessagesWindowFocus = null;
    }
    resetState();
}

function setupAutoTimeRefresh() {
    const checkTimeChange = () => {
        const nowHour = new Date().getHours();
        if (nowHour !== state.lastCheckedHour) {
            state.lastCheckedHour = nowHour;
            if (allMessages.length > 0) {
                renderMessages();
            }
        }
    };

    onMessagesWindowFocus = () => {
        const nowHour = new Date().getHours();
        if (nowHour !== state.lastCheckedHour) {
            state.lastCheckedHour = nowHour;
            if (allMessages.length > 0) {
                renderMessages();
            }
        }
    };

    if (!state.autoTimeInterval) {
        state.autoTimeInterval = setInterval(checkTimeChange, 30000);
        window.addEventListener('focus', onMessagesWindowFocus);
    }
}

function setupUserInterface(uid) {
    // Callbacks compartilhados entre lixeira e import-export
    const reloadAll = () => {
        loadMessages(uid);
        updateTrashCount(uid);
    };
    const trashCallbacks = { onReload: reloadAll };

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
        const text = el('msgText').value.trim();
        const title = el('msgTitle').value.trim();
        const category = el('msgCategory').value.trim() || 'Geral';
        if (!text) return showModal("A mensagem não pode estar vazia.");
        try {
            const lastSnap = await getDocs(query(collection(db, 'users', uid, 'messages'), orderBy('order', 'desc'), limit(1)));
            const maxOrder = lastSnap.empty ? 0 : (lastSnap.docs[0].data().order || 0);
            await addDoc(collection(db, 'users', uid, 'messages'), {
                text, title, category,
                order: maxOrder + 1, deleted: false, createdAt: Date.now()
            });
            clearMsgForm();
            el('newMsgBox').classList.add('hidden');
            loadMessages(uid);
        } catch (e) {
            console.error("Erro ao adicionar mensagem:", e);
            showModal("Erro ao salvar a mensagem.");
        }
    };

    // Exportar / Importar
    el('btnExport').onclick = () => {
        const modal = el('exportFormatModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            el('btnExportFormatJson')?.focus();
        }
        modal._exportLastFocus = document.activeElement;
    };

    const closeExportModal = () => {
        const modal = el('exportFormatModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            if (modal._exportLastFocus) {
                modal._exportLastFocus.focus();
                modal._exportLastFocus = null;
            }
        }
    };

    el('btnCancelExportFormat').onclick = closeExportModal;

    el('btnExportFormatTxt').onclick = () => {
        closeExportModal();
        exportToTxt();
    };

    el('btnExportFormatJson').onclick = () => {
        closeExportModal();
        exportToJson();
    };

    el('exportFormatModal').addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeExportModal();
            el('btnExport')?.focus();
        }
    });
    el('exportFormatModal').addEventListener('click', (e) => {
        if (e.target === el('exportFormatModal')) {
            closeExportModal();
        }
    });

    el('btnImport').onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.txt';
        input.onchange = (e) => importFromTxt(e, uid, { onDone: reloadAll });
        input.click();
    };

    // Lixeira
    el('btnTrashToggle').onclick = () => {
        const isHidden = el('trashBox').classList.toggle('hidden');
        if (!isHidden) loadTrash(uid, trashCallbacks);
    };
    el('btnCancelTrash').onclick = () => el('trashBox').classList.add('hidden');
    el('btnEmptyTrash').onclick = () => openConfirmModal(
        async () => {
            const btn = el('btnEmptyTrash');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Limpando...';
            try {
                await emptyTrash(uid, trashCallbacks);
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }, null,
        "Todas as mensagens da lixeira serão excluídas permanentemente."
    );
}

function clearMsgForm() {
    el('msgText').value = '';
    el('msgTitle').value = '';
    el('msgCategory').value = '';
}
