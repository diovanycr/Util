// ============================================================
//  messages.js — Orquestrador do módulo de mensagens
// ============================================================
//  Ponto de entrada público (auth.js, search.js). A lógica foi
//  dividida em submódulos sob js/messages/:
//    • state.js        — estado compartilhado (allMessages, flags)
//    • loader.js       — carregamento, renderização, edição, reorder
//    • import-export.js — importar/exportar TXT e JSON
//    • trash.js         — lixeira (loadTrash, emptyTrash, contagem)

import { el, db, collection, doc, query, orderBy, limit } from '../core/firebase.js';
import { getDocs, addDoc } from '../core/firebase-retry.js';
import { showModal, openConfirmModal, openModalContainer, closeModalContainer } from '../core/modal.js';
import { initHistory } from './history.js';
import { withButtonLoading } from '../core/utils.js';
import { initAIAssistant, openAIAssistantModal } from './aiAssistant.js';

import { state, allMessages, resetState } from './messages/state.js';
import {
    loadMessages,
    renderMessages,
    saveOrder,
    applyMessageSearchQuery,
    msgThrottle
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
    updateTrashCount,
    applyMessageSearchQuery
};

let onMessagesWindowFocus = null;
let _exportModalKeydown = null;
let _exportModalClick = null;

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
    initAIAssistant();
}

export function resetMessages() {
    if (onMessagesWindowFocus) {
        window.removeEventListener('focus', onMessagesWindowFocus);
        onMessagesWindowFocus = null;
    }
    if (_exportModalKeydown) {
        el('exportFormatModal')?.removeEventListener('keydown', _exportModalKeydown);
        _exportModalKeydown = null;
    }
    if (_exportModalClick) {
        el('exportFormatModal')?.removeEventListener('click', _exportModalClick);
        _exportModalClick = null;
    }
    resetState();
    msgThrottle.reset(); // garante que o próximo login não seja bloqueado pelo throttle
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

    // Busca inline de mensagens
    el('msgSearch')?.addEventListener('input', () => applyMessageSearchQuery());

    // Nova mensagem
    el('btnNewMsg').onclick = () => {
        el('newMsgBox').classList.remove('hidden');
        el('msgTitle').focus();
    };

    el('btnAiAssistMsg').onclick = () => {
        openAIAssistantModal(el('msgText'));
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
        const btn = el('btnAddMsg');
        await withButtonLoading(btn, async () => {
            const lastSnap = await getDocs(query(collection(db, 'users', uid, 'messages'), orderBy('order', 'desc'), limit(1)));
            const maxOrder = lastSnap.empty ? 0 : (lastSnap.docs[0].data().order || 0);
            await addDoc(collection(db, 'users', uid, 'messages'), {
                text, title, category,
                order: maxOrder + 1, deleted: false, createdAt: Date.now()
            });
            clearMsgForm();
            el('newMsgBox').classList.add('hidden');
            loadMessages(uid, { force: true });
        }, 'Salvando...');
    };

    // Exportar / Importar
    el('btnExport').onclick = () => {
        const modal = el('exportFormatModal');
        if (modal) {
            openModalContainer(modal, el('btnExportFormatJson'));
        }
    };

    const closeExportModal = () => {
        const modal = el('exportFormatModal');
        if (modal) {
            closeModalContainer(modal);
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

    _exportModalClick = (e) => {
        if (e.target === el('exportFormatModal')) {
            closeExportModal();
        }
    };
    el('exportFormatModal')?.addEventListener('click', _exportModalClick);

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
            await withButtonLoading(btn, async () => {
                await emptyTrash(uid, trashCallbacks);
            }, 'Limpando...');
        }, null,
        "Todas as mensagens da lixeira serão excluídas permanentemente."
    );
}

function clearMsgForm() {
    el('msgText').value = '';
    el('msgTitle').value = '';
    el('msgCategory').value = '';
}
