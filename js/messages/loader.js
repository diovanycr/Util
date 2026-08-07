// ============================================================
//  messages/loader.js — Carregamento, renderização e edição
// ============================================================

import {
    db, el,
    collection, doc,
    query, where, limit
} from '../firebase.js';
import { getDocs, addDoc, updateDoc, writeBatch } from '../firebase-retry.js';
import { openConfirmModal, showModal } from '../modal.js';
import { showToast } from '../toast.js';
import {
    escapeHtml, escapeAttr, addKeyboardDragSupport,
    getNextGreetingChange, isGreetingMessage
} from '../utils.js';
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
        if (visible) visibleCount++;
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
    list.innerHTML = `
        <div class="loading-state">
            <span class="spinner"></span>
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

    const filtered = allMessages.filter(m => {
        const cat   = (m.category || '').toLowerCase();
        const title = (m.title || '').toLowerCase();

        const isGreetingCategory = cat.includes('sauda') || title.startsWith('saud');
        if (!isGreetingCategory) return true;

        const isBomDia   = title.includes('bom dia');
        const isBoaTarde = title.includes('boa tarde');
        const isBoaNoite = title.includes('boa noite');

        if (!isBomDia && !isBoaTarde && !isBoaNoite) return true;

        if (currentHour < 12) {
            return !isBoaTarde && !isBoaNoite;
        } else if (currentHour < 18) {
            return !isBomDia && !isBoaNoite;
        } else {
            return !isBomDia;
        }
    });

    if (filtered.length === 0) {
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
    filtered.forEach(item => {
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

            let timeBadgeHtml = '';
            if (isGreeting) {
                const changeInfo = getNextGreetingChange(currentHour);
                timeBadgeHtml = `<span class="greeting-auto-badge" title="${escapeAttr(changeInfo)}"><i class="fa-regular fa-clock"></i> ${escapeHtml(changeInfo)}</span>`;
            }

            const userName = el('loggedUser')?.dataset?.username?.trim() || 'Usuário';

            const titleHtml = item.title
                ? `<span class="msg-title">${escapeHtml(item.title)} ${timeBadgeHtml}</span>`
                : (timeBadgeHtml ? `<span class="msg-title">${timeBadgeHtml}</span>` : '');

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

            row.ondragstart = () => { state.dragSrc = row; row.classList.add('dragging'); };
            row.ondragend   = () => { row.classList.remove('dragging'); saveOrder(state.currentUserId); };
            row.ondragover  = (e) => {
                e.preventDefault();
                const rect = row.getBoundingClientRect();
                const after = e.clientY > rect.top + rect.height / 2;
                row.parentNode.insertBefore(state.dragSrc, after ? row.nextSibling : row);
            };

            const handle = row.querySelector('.drag-handle');
            if (handle) {
                addKeyboardDragSupport(
                    handle,
                    () => [...row.parentNode.querySelectorAll('.user-row')],
                    () => saveOrder(state.currentUserId)
                );
            }

            groupEl.appendChild(row);
        });

        groupEl.ondragover = (e) => {
            e.preventDefault();
            if (!state.dragSrc || groupEl.contains(state.dragSrc)) return;
            groupEl.appendChild(state.dragSrc);
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
