// ============================================================
//  messages/loader.js — Carregamento, renderização e edição
// ============================================================

import {
    db, el,
    collection, doc,
    query, where, limit,
    updateDoc, increment
} from '../../core/firebase.js';
import { getDocs, addDoc, writeBatch } from '../../core/firebase-retry.js';
import { openConfirmModal, showModal } from '../../core/modal.js';
import { showToast } from '../../core/toast.js';
import {
    escapeHtml, escapeAttr, setupDragDrop,
    getNextGreetingChange, isGreetingMessage
} from '../../core/utils.js';
import { addToHistory, renderHistoryPanel } from '../history.js';
import { state, allMessages } from './state.js';
import { updateTrashCount } from './trash.js';

// --- FILTRO DE CATEGORIAS (sem re-renderizar DOM, aplica hidden-by-filter) ---

export function updateCategoryFilterBar() {
    const bar = el('msgCategoryFilterBar');
    if (!bar) return;

    const cats = [...new Set(allMessages.map(m => m.category || 'Geral'))].sort();
    if (cats.length <= 1) { bar.classList.add('hidden'); return; }

    bar.classList.remove('hidden');
    bar.innerHTML = '<span class="tag-filter-label">Filtrar:</span>';

    const allChip = document.createElement('button');
    allChip.className = `tag-filter-chip ${!state.activeCategoryFilter ? 'active' : ''}`;
    allChip.textContent = 'Todas';
    allChip.setAttribute('aria-pressed', !state.activeCategoryFilter ? 'true' : 'false');
    allChip.onclick = () => { state.activeCategoryFilter = null; updateCategoryFilterBar(); applyCategoryFilter(); };
    bar.appendChild(allChip);

    cats.forEach(cat => {
        const chip = document.createElement('button');
        chip.className = `tag-filter-chip ${state.activeCategoryFilter === cat ? 'active' : ''}`;
        chip.textContent = cat;
        chip.setAttribute('aria-pressed', state.activeCategoryFilter === cat ? 'true' : 'false');
        chip.onclick = () => {
            state.activeCategoryFilter = state.activeCategoryFilter === cat ? null : cat;
            updateCategoryFilterBar();
            applyCategoryFilter();
        };
        bar.appendChild(chip);
    });
}

export function applyCategoryFilter() {
    const list = el('msgList');
    const rows = list.querySelectorAll('.user-row');
    let visibleCount = 0;

    rows.forEach(row => {
        const cat = row.dataset.category || 'Geral';
        const visible = !state.activeCategoryFilter || cat === state.activeCategoryFilter;
        row.classList.toggle('hidden-by-filter', !visible);
        if (visible && !row.classList.contains('hidden-by-search')) visibleCount++;
    });

    document.querySelectorAll('#msgList .msg-group').forEach(group => {
        const hasVisible = [...group.querySelectorAll('.user-row')].some(r => !r.classList.contains('hidden-by-filter') && !r.classList.contains('hidden-by-search'));
        group.classList.toggle('hidden-by-filter', !hasVisible);
    });

    const event = new CustomEvent('updateMsgCount', { detail: visibleCount });
    document.dispatchEvent(event);
}

export function applyMessageSearchQuery() {
    const list = el('msgList');
    if (!list) return;
    const input = el('msgSearch');
    const query = input?.value.trim() || '';
    const q = query.toLowerCase();
    const rows = list.querySelectorAll('.user-row');
    let visibleCount = 0;

    const escapedQuery = escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = escapedQuery ? new RegExp(`(${escapedQuery})`, 'gi') : null;

    rows.forEach(row => {
        const id = row.dataset.id;
        const msg = allMessages.find(m => m.id === id);
        if (!msg) return;

        const titleText = msg.title || '';
        const bodyText = msg.text || '';
        const catText = msg.category || 'Geral';
        const fullStr = `${titleText} ${bodyText} ${catText}`.toLowerCase();
        const matches = !q || fullStr.includes(q);

        row.classList.toggle('hidden-by-search', !matches);

        const titleEl = row.querySelector('.msg-title');
        const textEl = row.querySelector('.msg-text');

        if (titleEl) {
            const safeTitle = escapeHtml(titleText);
            titleEl.innerHTML = regex ? safeTitle.replace(regex, '<mark>$1</mark>') : safeTitle;
        }

        if (textEl) {
            const userName = el('loggedUser')?.dataset?.username?.trim() || 'Usuário';
            let displayText = bodyText;
            if (displayText.includes('{usuario}')) {
                displayText = displayText.replace(/\{usuario\}/g, userName);
            }
            const safeText = escapeHtml(displayText);
            textEl.innerHTML = regex ? safeText.replace(regex, '<mark>$1</mark>') : safeText;
        }

        if (matches && !row.classList.contains('hidden-by-filter')) {
            visibleCount++;
        }
    });

    document.querySelectorAll('#msgList .msg-group').forEach(group => {
        const hasVisible = [...group.querySelectorAll('.user-row')].some(r => !r.classList.contains('hidden-by-filter') && !r.classList.contains('hidden-by-search'));
        group.classList.toggle('hidden-by-filter', !hasVisible);
    });

    const event = new CustomEvent('updateMsgCount', { detail: visibleCount });
    document.dispatchEvent(event);
}

// --- CARREGAMENTO E RENDERIZAÇÃO ---

export async function loadMessages(userId) {
    if (state.isLoadingMessages) return;
    state.isLoadingMessages = true;

    const list = el('msgList');
    if (!list) return;
    list.setAttribute('aria-busy', 'true');
    list.innerHTML = `
        <div class="loading-state">
            <span class="spinner" aria-hidden="true"></span>
            <span>Carregando mensagens...</span>
        </div>
    `;
    try {
        const snap = await getDocs(query(collection(db, 'users', userId, 'messages'), limit(500)));
        let allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (allDocs.length === 0) {
            const greetingsSnap = await getDocs(query(collection(db, 'users', userId, 'messages'), where('category', '==', 'Saudação')));
            if (greetingsSnap.empty) {
                const defaultGreetings = [
                    { title: 'Saudação - Bom dia', category: 'Saudação', text: 'Bom dia, {usuario}! Como posso te ajudar hoje?', order: 1, deleted: false, createdAt: Date.now() },
                    { title: 'Saudação - Boa tarde', category: 'Saudação', text: 'Boa tarde, {usuario}! Como posso te ajudar hoje?', order: 2, deleted: false, createdAt: Date.now() },
                    { title: 'Saudação - Boa noite', category: 'Saudação', text: 'Boa noite, {usuario}! Como posso te ajudar hoje?', order: 3, deleted: false, createdAt: Date.now() }
                ];
                const batch = writeBatch(db);
                for (const g of defaultGreetings) {
                    batch.set(doc(collection(db, 'users', userId, 'messages')), g);
                }
                await batch.commit();
                const newSnap = await getDocs(query(collection(db, 'users', userId, 'messages'), limit(500)));
                allDocs = newSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            }
        }

        updateTrashBadge(allDocs);

        allMessages.length = 0;
        allDocs
            .filter(d => !d.deleted)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .forEach(d => allMessages.push(d));

        updateCategoryFilterBar();
        renderMessages();

        const event = new CustomEvent('updateMsgCount', { detail: allMessages.length });
        document.dispatchEvent(event);
    } catch (err) {
        console.error("Erro ao carregar mensagens:", err);
        list.innerHTML = `<div class="empty-state-container"><i class="fa-solid fa-triangle-exclamation empty-state-icon"></i><p class="empty-state-title">Erro ao carregar mensagens</p></div>`;
    } finally {
        state.isLoadingMessages = false;
        list.removeAttribute('aria-busy');
    }
}

function updateTrashBadge(allDocs) {
    const badge = el('trashCount');
    if (!badge) return;
    const count = allDocs.filter(d => d.deleted).length;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
}

export function renderMessages() {
    const list = el('msgList');
    list.innerHTML = '';

    const now = new Date();
    const currentHour = now.getHours();

    if (allMessages.length === 0) {
        list.innerHTML = `
            <div class="empty-state-container">
                <i class="fa-regular fa-message empty-state-icon"></i>
                <p class="empty-state-title">Nenhuma mensagem encontrada</p>
                <p class="empty-state-desc">Cadastre novas respostas ou limpe os filtros para começar.</p>
                <button class="btn primary mt-12 btn-cta-new-msg"><i class="fa-solid fa-plus"></i> Nova mensagem</button>
            </div>
        `;
        list.querySelector('.btn-cta-new-msg')?.addEventListener('click', () => {
            el('btnNewMsg')?.click();
        });
        return;
    }

    const groups = {};
    allMessages.forEach(item => {
        const cat = item.category || 'Geral';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
    });

    Object.entries(groups).forEach(([category, items]) => {
        const groupEl = document.createElement('div');
        groupEl.className = 'msg-group';
        groupEl.dataset.category = category;
        groupEl.innerHTML = `<div class="msg-group-label">${escapeHtml(category)}</div>`;

        items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'user-row';
            row.dataset.id = item.id;
            row.dataset.category = item.category || 'Geral';

            const isGreeting = isGreetingMessage(item);

            // Determina se a saudação deve ser ocultada pelo horário
            let isGreetingHidden = false;
            if (isGreeting) {
                const isBomDia   = (item.title || '').toLowerCase().includes('bom dia');
                const isBoaTarde = (item.title || '').toLowerCase().includes('boa tarde');
                const isBoaNoite = (item.title || '').toLowerCase().includes('boa noite');

                if (currentHour < 12) {
                    isGreetingHidden = isBoaTarde || isBoaNoite;
                } else if (currentHour < 18) {
                    isGreetingHidden = isBomDia || isBoaNoite;
                } else {
                    isGreetingHidden = isBomDia;
                }
            }
            if (isGreetingHidden) row.classList.add('hidden-by-time');

            const userName = el('loggedUser')?.dataset?.username?.trim() || 'Usuário';

            const titleHtml = item.title
                ? `<span class="msg-title">${escapeHtml(item.title)}</span>`
                : '';

            let displayText = item.text;
            if (displayText.includes('{usuario}')) {
                displayText = displayText.replace(/\{usuario\}/g, userName);
            }

            row.innerHTML = `
                <span class="drag-handle">&#9776;</span>
                <div class="msg-content flex-1" tabindex="0" role="button" aria-label="Copiar mensagem: ${escapeAttr(displayText)}">
                    ${titleHtml}
                    <div class="msg-text">${escapeHtml(displayText)}</div>
                </div>
                <button class="btn ghost btn-duplicate" title="Duplicar mensagem" aria-label="Duplicar mensagem"><i class="fa-solid fa-clone" aria-hidden="true"></i></button>
                <button class="btn ghost btn-edit" aria-label="Editar mensagem"><i class="fa-solid fa-pen" aria-hidden="true"></i></button>
                <button class="btn ghost btn-del" aria-label="Excluir mensagem"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>
            `;

            const copyAction = async () => {
                try {
                    const textToCopy = item.text.includes('{usuario}')
                        ? item.text.replace(/\{usuario\}/g, userName)
                        : item.text;
                    await navigator.clipboard.writeText(textToCopy);
                    addToHistory(textToCopy, item.title || '', item.category || 'Geral');
                    renderHistoryPanel();
                    updateDoc(doc(db, 'users', state.currentUserId, 'messages', item.id), { copyCount: increment(1) }).then(() => {
                        document.dispatchEvent(new CustomEvent('copy-count-updated'));
                    }).catch(err => console.error('Erro ao incrementar copyCount:', err));
                    showToast("Copiado!");
                } catch (err) { console.error(err); }
            };

            const contentEl = row.querySelector('.msg-content');
            contentEl.onclick = copyAction;
            contentEl.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    copyAction();
                }
            };

            row.querySelector('.btn-duplicate').onclick = async () => {
                try {
                    const maxOrder = allMessages.reduce((max, m) => Math.max(max, m.order || 0), 0);
                    const dupTitle = item.title ? `${item.title} (Cópia)` : 'Cópia';
                    await addDoc(collection(db, 'users', state.currentUserId, 'messages'), {
                        title: dupTitle,
                        text: item.text,
                        category: item.category || 'Geral',
                        order: maxOrder + 1,
                        deleted: false,
                        createdAt: Date.now(),
                        copyCount: 0
                    });
                    showToast("Mensagem duplicada!");
                    loadMessages(state.currentUserId);
                } catch (err) {
                    console.error("Erro ao duplicar mensagem:", err);
                    showModal("Erro ao duplicar mensagem.");
                }
            };

            row.querySelector('.btn-edit').onclick = () => enterEditMode(row, item, state.currentUserId);

            row.querySelector('.btn-del').onclick = () => {
                openConfirmModal(
                    async () => {
                        try {
                            await updateDoc(doc(db, 'users', state.currentUserId, 'messages', item.id), { deleted: true });
                            loadMessages(state.currentUserId);
                            updateTrashCount(state.currentUserId);
                            showToast('Mensagem movida para a lixeira.');
                        } catch (err) { showModal('Erro ao mover para a lixeira.'); }
                    },
                    null,
                    'Mover esta mensagem para a lixeira?'
                );
            };

            setupDragDrop(
                row,
                row.querySelector('.drag-handle'),
                list,
                () => [...list.querySelectorAll('.user-row')],
                () => saveOrder(state.currentUserId)
            );

            groupEl.appendChild(row);
        });

        // Cross-group drop on group container (for empty groups)
        groupEl.ondragover = (e) => {
            e.preventDefault();
        };

        list.appendChild(groupEl);
    });

    document.dispatchEvent(new Event('itemsRendered'));
    applyCategoryFilter();
}

export function enterEditMode(row, item, userId) {
    const actionsHtml = `
        <button class="btn ghost btn-cancel-edit"><i class="fa-solid fa-xmark"></i></button>
        <button class="btn primary btn-save-edit"><i class="fa-solid fa-check"></i></button>
    `;
    row.innerHTML = `
        <span class="drag-handle">&#9776;</span>
        <div class="msg-edit-fields">
            <label for="edit-msg-title" class="sr-only">Título da mensagem (opcional)</label>
            <input id="edit-msg-title" class="edit-msg-title"    type="text" value="${escapeAttr(item.title || '')}"    placeholder="Título (opcional)..." aria-label="Título da mensagem (opcional)" />
            <label for="edit-msg-category" class="sr-only">Categoria</label>
            <input id="edit-msg-category" class="edit-msg-category" type="text" value="${escapeAttr(item.category || '')}" placeholder="Categoria..." aria-label="Categoria da mensagem" />
            <label for="edit-msg-text" class="sr-only">Texto da mensagem</label>
            <textarea id="edit-msg-text" class="edit-msg-text" rows="3" aria-label="Texto da mensagem">${escapeHtml(item.text)}</textarea>
        </div>
        ${actionsHtml}
    `;

    row.querySelector('.edit-msg-text').focus();

    const saveEdit = async () => {
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

    row.querySelector('.btn-cancel-edit').onclick = () => loadMessages(userId);
    row.querySelector('.btn-save-edit').onclick = saveEdit;

    row.querySelector('.edit-msg-text').onkeydown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        }
    };
}

export async function saveOrder(userId) {
    const list = el('msgList');
    const rows = [...list.querySelectorAll('.user-row')];
    try {
        const batch = writeBatch(db);
        let changes = 0;

        const visibleOrder = new Map();
        rows.forEach((row, i) => {
            const id = row.dataset.id;
            const category = row.closest('.msg-group')?.dataset.category || 'Geral';
            if (id) visibleOrder.set(id, { order: i + 1, category });
        });

        allMessages.forEach((msg, idx) => {
            const visible = visibleOrder.get(msg.id);
            const newOrder = visible ? visible.order : (msg.order ?? 0);
            const newCategory = visible ? visible.category : msg.category;
            if (msg.order !== newOrder || msg.category !== newCategory) {
                batch.update(doc(db, 'users', userId, 'messages', msg.id), { order: newOrder, category: newCategory });
                msg.order = newOrder;
                msg.category = newCategory;
                changes++;
            }
        });

        if (changes > 0) await batch.commit();
        allMessages.sort((a, b) => (a.order || 0) - (b.order || 0));
        updateCategoryFilterBar();
    } catch (err) { console.error("Erro ao salvar ordem:", err); }
}
