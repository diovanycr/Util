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
import { escapeHtml, escapeAttr, addKeyboardDragSupport } from './utils.js';
import { addToHistory, initHistory, renderHistoryPanel } from './history.js';

let currentUserId = null;
let dragSrc = null;
let uiInitialized = false;
export let allMessages = [];
let activeCategoryFilter = null;
let lastCheckedHour = new Date().getHours();

export function initMessages(uid) {
    currentUserId = uid;
    if (!uiInitialized) {
        setupUserInterface();
        setupAutoTimeRefresh();
        uiInitialized = true;
    }
    loadMessages(uid);
    updateTrashCount(uid);
    initHistory();
}

let autoTimeInterval = null;

const onMessagesWindowFocus = () => {
    const nowHour = new Date().getHours();
    if (nowHour !== lastCheckedHour) {
        lastCheckedHour = nowHour;
        if (allMessages.length > 0) {
            renderMessages();
        }
    }
};

export function resetMessages() {
    uiInitialized = false;
    currentUserId = null;
    activeCategoryFilter = null;
    if (autoTimeInterval) {
        clearInterval(autoTimeInterval);
        autoTimeInterval = null;
    }
    window.removeEventListener('focus', onMessagesWindowFocus);
}

function setupAutoTimeRefresh() {
    // Re-renderiza a lista automaticamente se a hora mudar (ex: virada das 12h ou 18h)
    const checkTimeChange = () => {
        const nowHour = new Date().getHours();
        if (nowHour !== lastCheckedHour) {
            lastCheckedHour = nowHour;
            if (allMessages.length > 0) {
                renderMessages();
            }
        }
    };

    // Checa a cada 30 segundos
    if (!autoTimeInterval) {
        autoTimeInterval = setInterval(checkTimeChange, 30000);
        window.addEventListener('focus', onMessagesWindowFocus);
    }
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
    el('btnExport').onclick = () => {
        const modal = el('exportFormatModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            el('btnExportFormatJson')?.focus();
        }
    };

    el('btnCancelExportFormat').onclick = () => {
        const modal = el('exportFormatModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    };

    el('btnExportFormatTxt').onclick = () => {
        const modal = el('exportFormatModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
        exportToTxt(currentUserId);
    };

    el('btnExportFormatJson').onclick = () => {
        const modal = el('exportFormatModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
        exportToJson(currentUserId);
    };

    el('exportFormatModal').addEventListener('click', (e) => {
        if (e.target === el('exportFormatModal')) {
            el('exportFormatModal').classList.add('hidden');
            el('exportFormatModal').style.display = 'none';
        }
    });

    el('btnImport').onclick = () => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json,.txt';
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
    list.innerHTML = `
        <div class="loading-state">
            <span class="spinner"></span>
            <span>Carregando mensagens...</span>
        </div>
    `;
    try {
        const snap = await getDocs(collection(db, 'users', userId, 'messages'));
        let allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Se o usuário não possuir nenhuma mensagem cadastrada, cria saudações padrão com {usuario}
        if (allDocs.length === 0) {
            const defaultGreetings = [
                { title: 'Saudação - Bom dia', category: 'Saudação', text: 'Bom dia, {usuario}! Como posso te ajudar hoje?', order: 1, deleted: false, createdAt: Date.now() },
                { title: 'Saudação - Boa tarde', category: 'Saudação', text: 'Boa tarde, {usuario}! Como posso te ajudar hoje?', order: 2, deleted: false, createdAt: Date.now() },
                { title: 'Saudação - Boa noite', category: 'Saudação', text: 'Boa noite, {usuario}! Como posso te ajudar hoje?', order: 3, deleted: false, createdAt: Date.now() }
            ];
            for (const g of defaultGreetings) {
                await addDoc(collection(db, 'users', userId, 'messages'), g);
            }
            const newSnap = await getDocs(collection(db, 'users', userId, 'messages'));
            allDocs = newSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        _updateTrashBadge(allDocs);

        allMessages = allDocs
            .filter(d => !d.deleted)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        updateCategoryFilterBar();
        renderMessages();
        
        const event = new CustomEvent('updateMsgCount', { detail: allMessages.length });
        document.dispatchEvent(event);
    } catch (err) {
        console.error("Erro ao carregar mensagens:", err);
        list.innerHTML = `<div class="empty-state-container"><i class="fa-solid fa-triangle-exclamation empty-state-icon"></i><p class="empty-state-title">Erro ao carregar mensagens</p></div>`;
    }
}

function renderMessages() {
    const list = el('msgList');
    list.innerHTML = '';

    const now = new Date();
    const currentHour = now.getHours();

    const categoryFiltered = activeCategoryFilter
        ? allMessages.filter(m => (m.category || 'Geral') === activeCategoryFilter)
        : allMessages;

    // Filtro por horário para saudações ("Bom dia" antes das 12h, "Boa tarde" a partir das 12h)
    const filtered = categoryFiltered.filter(m => {
        const cat = (m.category || '').toLowerCase();
        const title = (m.title || '').toLowerCase();
        const text = (m.text || '').toLowerCase();

        // Identifica se a mensagem é especificamente uma saudação de Bom Dia, Boa Tarde ou Boa Noite
        const isBomDia   = title.includes('bom dia')   || text.includes('bom dia');
        const isBoaTarde = title.includes('boa tarde') || text.includes('boa tarde');
        const isBoaNoite = title.includes('boa noite') || text.includes('boa noite');

        // Se não for uma mensagem de saudação específica com esses termos, mantém visível
        if (!isBomDia && !isBoaTarde && !isBoaNoite) return true;

        if (currentHour < 12) {
            // Período da manhã (00:00 até 11:59): Exibe "Bom dia", oculta "Boa tarde" e "Boa noite"
            if (isBoaTarde || isBoaNoite) return false;
            return true;
        } else if (currentHour < 18) {
            // Período da tarde (12:00 até 17:59): Exibe "Boa tarde", oculta "Bom dia" e "Boa noite"
            if (isBomDia || isBoaNoite) return false;
            return true;
        } else {
            // Período da noite (18:00 até 23:59): Exibe "Boa noite" (ou "Boa tarde" se não houver boa noite), oculta "Bom dia"
            if (isBomDia) return false;
            return true;
        }
    });

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-state-container">
                <i class="fa-regular fa-message empty-state-icon"></i>
                <p class="empty-state-title">Nenhuma mensagem encontrada</p>
                <p class="empty-state-desc">Cadastre novas respostas ou limpe os filtros para começar.</p>
            </div>
        `;
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
            row.draggable = true;
            row.dataset.id = item.id;

            const isGreeting = (item.category || '').toLowerCase().includes('sauda') ||
                               (item.title || '').toLowerCase().includes('bom dia') ||
                               (item.title || '').toLowerCase().includes('boa tarde') ||
                               (item.title || '').toLowerCase().includes('boa noite') ||
                               (item.text || '').toLowerCase().includes('bom dia') ||
                               (item.text || '').toLowerCase().includes('boa tarde') ||
                               (item.text || '').toLowerCase().includes('boa noite');

            let timeBadgeHtml = '';
            if (isGreeting) {
                let changeInfo = '';
                if (currentHour < 12) {
                    changeInfo = 'Muda automaticamente para Boa tarde às 12:00';
                } else if (currentHour < 18) {
                    changeInfo = 'Muda automaticamente para Boa noite às 18:00';
                } else {
                    changeInfo = 'Muda automaticamente para Bom dia às 00:00';
                }
                timeBadgeHtml = `<span class="greeting-auto-badge" title="${changeInfo}"><i class="fa-regular fa-clock"></i> ${changeInfo}</span>`;
            }

            const userName = el('loggedUser')?.textContent?.trim() || 'Usuário';

            const titleHtml = item.title
                ? `<span class="msg-title">${escapeHtml(item.title)} ${timeBadgeHtml}</span>`
                : (timeBadgeHtml ? `<span class="msg-title">${timeBadgeHtml}</span>` : '');

            let displayText = item.text;
            if (displayText.includes('{usuario}')) {
                displayText = displayText.replace(/\{usuario\}/g, userName);
            }

            row.innerHTML = `
                <span class="drag-handle">&#9776;</span>
                <div class="msg-content" tabindex="0" role="button" aria-label="Copiar mensagem: ${escapeAttr(displayText)}" style="flex:1; cursor:pointer; min-width:0;">
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

            // Copiar ao clicar + registrar no histórico
            const contentEl = row.querySelector('.msg-content');
            contentEl.onclick = copyAction;
            contentEl.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    copyAction();
                }
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

            // Drag (mouse)
            row.ondragstart = () => { dragSrc = row; row.classList.add('dragging'); };
            row.ondragend   = () => { row.classList.remove('dragging'); saveOrder(currentUserId); };
            row.ondragover  = (e) => {
                e.preventDefault();
                const rect = row.getBoundingClientRect();
                const after = e.clientY > rect.top + rect.height / 2;
                row.parentNode.insertBefore(dragSrc, after ? row.nextSibling : row);
            };

            // Drag (teclado)
            const handle = row.querySelector('.drag-handle');
            if (handle) {
                addKeyboardDragSupport(
                    handle,
                    () => [...row.parentNode.querySelectorAll('.user-row')],
                    () => saveOrder(currentUserId)
                );
            }

            groupEl.appendChild(row);
        });

        list.appendChild(groupEl);
    });
    
    document.dispatchEvent(new Event('itemsRendered'));
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

// --- IMPORTAR / EXPORTAR ---

async function importFromTxt(event, userId) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const rawContent = e.target.result;
            const content = rawContent.trim();
            
            let messagesToImport = [];
            
            if (content.startsWith('[') && content.endsWith(']')) {
                // Formato JSON
                const parsed = JSON.parse(content);
                messagesToImport = parsed.map(item => ({
                    text: item.text || '',
                    title: item.title || '',
                    category: item.category || 'Geral',
                    order: item.order || 999
                })).filter(item => item.text);
            } else {
                // Formato TXT (linha por linha, restaurando \n escapado)
                const newLines = rawContent.split('\n').map(l => l.trim()).filter(Boolean);
                messagesToImport = newLines.map(line => ({
                    text: line.replace(/\\n/g, '\n').replace(/\\r/g, '\r'),
                    title: '',
                    category: 'Geral',
                    order: 999
                }));
            }

            if (messagesToImport.length === 0) return showModal("O arquivo está vazio ou inválido.");

            const snap = await getDocs(collection(db, 'users', userId, 'messages'));
            const existingItems = snap.docs.map(d => ({ id: d.id, text: d.data().text }));
            const duplicates = messagesToImport.filter(item => existingItems.some(ext => ext.text === item.text));

            const processImport = async (replaceDuplicates) => {
                let added = 0;
                for (const item of messagesToImport) {
                    const existing = existingItems.find(ext => ext.text === item.text);
                    if (existing) {
                        if (replaceDuplicates) {
                            await updateDoc(doc(db, 'users', userId, 'messages', existing.id), { 
                                deleted: false, 
                                title: item.title || '',
                                category: item.category || 'Geral',
                                updatedAt: Date.now() 
                            });
                            added++;
                        }
                    } else {
                        await addDoc(collection(db, 'users', userId, 'messages'), {
                            text: item.text, 
                            title: item.title || '', 
                            category: item.category || 'Geral',
                            order: item.order || 999, 
                            deleted: false, 
                            createdAt: Date.now()
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
        } catch (err) { showModal("Erro ao ler o arquivo."); }
    };
    reader.readAsText(file);
}

async function exportToTxt(userId) {
    try {
        if (allMessages.length === 0) return showModal("Não há mensagens para exportar.");
        
        // Exporta como TXT, escapando quebras de linha para manter cada mensagem em uma linha no arquivo
        const lines = allMessages.map(d => d.text.replace(/\n/g, '\\n').replace(/\r/g, '\\r'));
        const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_mensagens_${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        
        URL.revokeObjectURL(url);
        showToast("Exportado como TXT!");
    } catch (e) { showModal("Erro ao exportar."); }
}

async function exportToJson(userId) {
    try {
        if (allMessages.length === 0) return showModal("Não há mensagens para exportar.");
        
        // Exporta o backup completo com títulos e categorias
        const exportData = allMessages.map(({ text, title, category }) => ({ text, title: title || '', category: category || 'Geral' }));
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_mensagens_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showToast("Exportado como JSON!");
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
            const category = row.closest('.msg-group')?.dataset.category || 'Geral';
            if (id) batch.update(doc(db, 'users', userId, 'messages', id), { order: i + 1, category });
        });
        await batch.commit();

        // Atualiza a lista local allMessages com a nova ordem e categorias
        rows.forEach((row, i) => {
            const id = row.dataset.id;
            const category = row.closest('.msg-group')?.dataset.category || 'Geral';
            const msg = allMessages.find(m => m.id === id);
            if (msg) {
                msg.order = i + 1;
                msg.category = category;
            }
        });

        // Reordena localmente e atualiza os chips de categoria
        allMessages.sort((a, b) => (a.order || 0) - (b.order || 0));
        updateCategoryFilterBar();
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
