/**
 * links.js â€” Aba de Links Ãšteis
 * Links salvos no Firestore, clicÃ¡veis e organizados por categoria
 */

import {
    db, el,
    collection,
    doc,
    query,
    orderBy,
    limit
} from '../core/firebase.js';
import { getDocs, addDoc, deleteDoc, updateDoc, writeBatch } from '../core/firebase-retry.js';

import { showModal, openConfirmModal } from '../core/modal.js';
import { showToast } from '../core/toast.js';
import { escapeHtml, escapeAttr, debounce, setupDragDrop } from '../core/utils.js';

let currentUserId = null;
export let allLinks = [];
let uiInitialized = false;

export function initLinks(uid) {
    currentUserId = uid;
    if (!uiInitialized) {
        setupLinksInterface();
        uiInitialized = true;
    }
    loadLinks(uid);
}

export function resetLinks() {
    uiInitialized = false;
    currentUserId = null;
    allLinks.length = 0;
    const list = el('linkList');
    if (list) list.innerHTML = '';
}

function setupLinksInterface() {
    el('btnNewLink').onclick = () => {
        el('newLinkBox').classList.remove('hidden');
        el('linkUrl').focus();
    };

    el('btnCancelLink').onclick = () => {
        clearLinkForm();
        el('newLinkBox').classList.add('hidden');
    };

    el('btnAddLink').onclick = async () => {
        if (!currentUserId) return showModal("SessÃ£o expirada. FaÃ§a login novamente.");
        let url = el('linkUrl').value.trim();
        const title = el('linkTitle').value.trim();
        const category = el('linkCategory').value.trim();

        if (!url) return showModal("A URL Ã© obrigatÃ³ria.");

        // Adiciona https:// se nÃ£o tiver protocolo
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

        // Valida URL bÃ¡sica
        try { new URL(url); } catch {
            return showModal("URL invÃ¡lida. Verifique e tente novamente.");
        }

        // Tenta obter tÃ­tulo via favicon/metadata se nÃ£o preenchido
        const displayTitle = title || extractDomain(url);

        try {
            await addDoc(collection(db, 'users', currentUserId, 'links'), {
                url,
                title: displayTitle,
                category: category || 'Geral',
                createdAt: Date.now()
            });
            clearLinkForm();
            el('newLinkBox').classList.add('hidden');
            showToast("Link salvo!");
            loadLinks(currentUserId);
        } catch (e) {
            console.error(e);
            showModal("Erro ao salvar o link.");
        }
    };

    el('linkSearch').oninput = debounce(() => {
        filterLinks(el('linkSearch').value.trim().toLowerCase());
    }, 200);
}

function extractDomain(url) {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return url;
    }
}

function clearLinkForm() {
    el('linkUrl').value = '';
    el('linkTitle').value = '';
    el('linkCategory').value = '';
}

async function loadLinks(userId) {
    const list = el('linkList');
    if (!list) return;

    try {
        const snap = await getDocs(query(collection(db, 'users', userId, 'links'), orderBy('createdAt'), limit(500)));
        list.innerHTML = '';

        allLinks = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999) || (a.createdAt || 0) - (b.createdAt || 0));

        // Atualiza contador na aba
        const event = new CustomEvent('updateLinkCount', { detail: allLinks.length });
        document.dispatchEvent(event);

        if (allLinks.length === 0) {
            list.innerHTML = `
                <div class="empty-state-container">
                    <i class="fa-solid fa-link empty-state-icon"></i>
                    <p class="empty-state-title">Nenhum link cadastrado</p>
                    <p class="empty-state-desc">Adicione links Ãºteis e atalhos rÃ¡pidos para facilitar seu atendimento.</p>
                    <button class="btn primary mt-12 btn-cta-new-link"><i class="fa-solid fa-plus"></i> Novo link</button>
                </div>
            `;
            list.querySelector('.btn-cta-new-link')?.addEventListener('click', () => {
                el('btnNewLink')?.click();
            });
            return;
        }

        renderLinks(list, allLinks);
    } catch (err) {
        console.error("Erro ao carregar links:", err);
        list.innerHTML = `
            <div class="empty-state-container">
                <i class="fa-solid fa-triangle-exclamation empty-state-icon" style="color:var(--danger, #ef4444);"></i>
                <p class="empty-state-title">Erro ao carregar links</p>
                <p class="empty-state-desc">NÃ£o foi possÃ­vel conectar ao banco de dados. Verifique sua conexÃ£o e tente novamente.</p>
            </div>
        `;
    }
}

function renderLinks(container, links) {
    container.innerHTML = '';

    // Agrupa por categoria
    const groups = {};
    links.forEach(link => {
        const cat = link.category || 'Geral';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(link);
    });

    Object.entries(groups).forEach(([category, items]) => {
        const group = document.createElement('div');
        group.className = 'link-group';
        group.innerHTML = `<div class="link-group-label">${escapeHtml(category)}</div>`;

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'link-card';
            card.innerHTML = `
                <a class="link-main" href="${escapeAttr(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir link: ${escapeAttr(item.title)}">
                    <img class="link-favicon" 
                         src="https://www.google.com/s2/favicons?domain=${escapeAttr(extractDomain(item.url))}&sz=32"
                         onerror="this.style.display='none'"
                         alt="Ãcone de ${escapeAttr(item.title)}" />
                    <div class="link-info">
                        <span class="link-title">${escapeHtml(item.title)}</span>
                        <span class="link-url">${escapeHtml(extractDomain(item.url))}</span>
                    </div>
                    <i class="fa-solid fa-arrow-up-right-from-square link-open-icon" aria-hidden="true"></i>
                </a>
                <button class="btn ghost link-drag-handle" title="Reordenar link"><i class="fa-solid fa-grip-lines" aria-hidden="true"></i></button>
                <button class="btn ghost link-edit-btn" title="Editar link" aria-label="Editar link ${escapeAttr(item.title)}">
                    <i class="fa-solid fa-pen" aria-hidden="true"></i>
                </button>
                <button class="btn ghost link-del-btn" title="Remover link" aria-label="Remover link ${escapeAttr(item.title)}">
                    <i class="fa-solid fa-trash" aria-hidden="true"></i>
                </button>
            `;

            card.querySelector('.link-edit-btn').onclick = (e) => {
                e.stopPropagation();
                enterEditMode(card, item);
            };

            card.querySelector('.link-del-btn').onclick = (e) => {
                e.stopPropagation();
                if (!currentUserId) return;
                openConfirmModal(
                    async () => {
                        try {
                            await deleteDoc(doc(db, 'users', currentUserId, 'links', item.id));
                            showToast("Link removido!");
                            loadLinks(currentUserId);
                        } catch (err) {
                            showModal("Erro ao remover o link.");
                        }
                    },
                    null,
                    `Deseja realmente remover o link "${item.title}"? Esta aÃ§Ã£o nÃ£o poderÃ¡ ser desfeita.`
                );
            };
            const dragHandle = card.querySelector('.link-drag-handle');
            setupDragDrop(
                card,
                dragHandle,
                container,
                () => [...container.querySelectorAll('.link-card')],
                () => saveLinkOrder(currentUserId),
                (target) => target.parentNode === card.parentNode
            );

            group.appendChild(card);
        });

        container.appendChild(group);
    });
    
    // Dispara evento para adicionar estrelas de favoritos
    document.dispatchEvent(new Event('itemsRendered'));
}

function enterEditMode(card, item) {
    // Preserva a estrutura original: apenas esconde os botÃµes de ediÃ§Ã£o/exclusÃ£o
    // e injeta o form no lugar do conteÃºdo principal. Cancelar/Salvar chama loadLinks,
    // que re-renderiza a lista e restaura tudo.
    const mainEl  = card.querySelector('.link-main');
    const editBtn = card.querySelector('.link-edit-btn');
    const delBtn  = card.querySelector('.link-del-btn');
    const dragBtn = card.querySelector('.link-drag-handle');
    if (!mainEl) return;

    const form = document.createElement('div');
    form.className = 'link-edit-form';
    form.innerHTML = `
        <input class="edit-link-url"   type="url"  value="${escapeAttr(item.url)}"   placeholder="URL..." />
        <input class="edit-link-title" type="text" value="${escapeAttr(item.title)}" placeholder="TÃ­tulo..." />
        <input class="edit-link-cat"   type="text" value="${escapeAttr(item.category || '')}" placeholder="Categoria..." />
        <div class="flex-end mt-10">
            <button class="btn ghost btn-cancel-link-edit">Cancelar</button>
            <button class="btn primary btn-save-link-edit">Salvar</button>
        </div>
    `;

    mainEl.replaceWith(form);
    if (editBtn) editBtn.style.display = 'none';
    if (delBtn)  delBtn.style.display  = 'none';
    if (dragBtn) dragBtn.style.display = 'none';
    card.draggable = false;

    form.querySelector('.edit-link-url').focus();

    const restoreView = () => {
        form.replaceWith(mainEl);
        if (editBtn) editBtn.style.display = '';
        if (delBtn)  delBtn.style.display  = '';
        if (dragBtn) dragBtn.style.display = '';
        card.draggable = true;
    };

    const saveLinkEdit = async () => {
        if (!currentUserId) return showModal("SessÃ£o expirada. FaÃ§a login novamente.");
        let url   = form.querySelector('.edit-link-url').value.trim();
        const title    = form.querySelector('.edit-link-title').value.trim();
        const category = form.querySelector('.edit-link-cat').value.trim();

        if (!url) return showModal("A URL Ã© obrigatÃ³ria.");
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        try { new URL(url); } catch { return showModal("URL invÃ¡lida."); }

        try {
            await updateDoc(doc(db, 'users', currentUserId, 'links', item.id), {
                url,
                title: title || extractDomain(url),
                category: category || 'Geral'
            });
            showToast("Link atualizado!");
            loadLinks(currentUserId);
        } catch (err) {
            showModal("Erro ao atualizar o link.");
            restoreView();
        }
    };

    form.querySelector('.btn-cancel-link-edit').onclick = () => {
        restoreView();
    };
    form.querySelector('.btn-save-link-edit').onclick = saveLinkEdit;

    form.querySelectorAll('input').forEach(input => {
        input.onkeydown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                saveLinkEdit();
            }
        };
    });
}

async function saveLinkOrder(userId) {
    if (!userId) return;
    const list = el('linkList');
    if (!list) return;
    const cards = [...list.querySelectorAll('.link-card')];
    try {
        const batch = writeBatch(db);
        const newOrder = {};
        let changed = 0;
        cards.forEach((card, i) => {
            const id = card.dataset.id;
            const newOrd = i + 1;
            if (id) newOrder[id] = newOrd;
            const existing = allLinks.find(l => l.id === id);
            if (existing && existing.order !== newOrd) {
                batch.update(doc(db, 'users', userId, 'links', id), { order: newOrd });
                changed++;
            }
        });
        if (changed > 0) await batch.commit();
        // Atualiza allLinks com nova ordem para manter consistÃªncia
        allLinks.forEach(l => { if (newOrder[l.id] !== undefined) l.order = newOrder[l.id]; });
    } catch (err) {
        console.error("Erro ao salvar ordem dos links:", err);
    }
}

function filterLinks(query) {
    const list = el('linkList');
    const cards = list.querySelectorAll('.link-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const id = card.dataset.id;
        const item = allLinks.find(l => l.id === id);
        if (!item) return;
        const visible = !query || `${item.title} ${item.url} ${item.category}`.toLowerCase().includes(query);
        card.classList.toggle('hidden-by-search', !visible);
        if (visible) visibleCount++;
    });

    // Oculta grupos vazios
    list.querySelectorAll('.link-group').forEach(group => {
        const hasVisible = [...group.querySelectorAll('.link-card')].some(c => !c.classList.contains('hidden-by-search'));
        group.classList.toggle('hidden-by-search', !hasVisible);
    });

    // Se nÃ£o houver query e todos visÃ­veis, garante que nenhum grupo fique oculto
    if (!query) {
        list.querySelectorAll('.link-group').forEach(g => g.classList.remove('hidden-by-search'));
    }
}
