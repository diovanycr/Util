/**
 * links.js — Aba de Links Úteis
 * Links salvos no Firestore, clicáveis e organizados por categoria
 */

import {
    db, el,
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    writeBatch,
    updateDoc
} from './firebase.js';

import { showModal } from './modal.js';
import { showToast } from './toast.js';
import { escapeHtml, escapeAttr } from './utils.js';

let currentUserId = null;
let allLinks = [];
let uiInitialized = false;
let dragSrcLink = null;

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
        let url = el('linkUrl').value.trim();
        const title = el('linkTitle').value.trim();
        const category = el('linkCategory').value.trim();

        if (!url) return showModal("A URL é obrigatória.");

        // Adiciona https:// se não tiver protocolo
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

        // Valida URL básica
        try { new URL(url); } catch {
            return showModal("URL inválida. Verifique e tente novamente.");
        }

        // Tenta obter título via favicon/metadata se não preenchido
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

    el('linkSearch').oninput = () => {
        filterLinks(el('linkSearch').value.trim().toLowerCase());
    };
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
        const snap = await getDocs(collection(db, 'users', userId, 'links'));
        list.innerHTML = '';

        allLinks = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999) || (a.createdAt || 0) - (b.createdAt || 0));

        // Atualiza contador na aba
        const event = new CustomEvent('updateLinkCount', { detail: allLinks.length });
        document.dispatchEvent(event);

        if (allLinks.length === 0) {
            list.innerHTML = '<p class="sub center">Nenhum link cadastrado.</p>';
            return;
        }

        renderLinks(list, allLinks);
    } catch (err) {
        console.error("Erro ao carregar links:", err);
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
                <a class="link-main" href="${escapeAttr(item.url)}" target="_blank" rel="noopener noreferrer">
                    <img class="link-favicon" 
                         src="https://www.google.com/s2/favicons?domain=${escapeAttr(extractDomain(item.url))}&sz=32"
                         onerror="this.style.display='none'"
                         alt="" />
                    <div class="link-info">
                        <span class="link-title">${escapeHtml(item.title)}</span>
                        <span class="link-url">${escapeHtml(extractDomain(item.url))}</span>
                    </div>
                    <i class="fa-solid fa-arrow-up-right-from-square link-open-icon"></i>
                </a>
                <button class="btn ghost link-edit-btn" title="Editar link">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn ghost link-del-btn" title="Remover link">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;

            card.querySelector('.link-edit-btn').onclick = (e) => {
                e.stopPropagation();
                enterEditMode(card, item);
            };

            card.querySelector('.link-del-btn').onclick = async (e) => {
                e.stopPropagation();
                try {
                    await deleteDoc(doc(db, 'users', currentUserId, 'links', item.id));
                    showToast("Link removido!");
                    loadLinks(currentUserId);
                } catch (err) {
                    showModal("Erro ao remover o link.");
                }
            };

            // Drag-and-drop
            card.draggable = true;
            card.dataset.id = item.id;
            card.ondragstart = (e) => {
                dragSrcLink = card;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            };
            card.ondragend = () => {
                card.classList.remove('dragging');
                saveLinkOrder(currentUserId);
            };
            card.ondragover = (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (!dragSrcLink || dragSrcLink === card) return;
                const rect  = card.getBoundingClientRect();
                const after = e.clientY > rect.top + rect.height / 2;
                // Insere no pai direto do card de destino
                const parent = card.parentNode;
                parent.insertBefore(dragSrcLink, after ? card.nextSibling : card);
            };

            group.appendChild(card);
        });

        container.appendChild(group);
    });
}

function enterEditMode(card, item) {
    card.innerHTML = `
        <div class="link-edit-form">
            <input class="edit-link-url"   type="url"  value="${escapeAttr(item.url)}"   placeholder="URL..." />
            <input class="edit-link-title" type="text" value="${escapeAttr(item.title)}" placeholder="Título..." />
            <input class="edit-link-cat"   type="text" value="${escapeAttr(item.category || '')}" placeholder="Categoria..." />
            <div class="flex-end mt-10">
                <button class="btn ghost btn-cancel-link-edit">Cancelar</button>
                <button class="btn primary btn-save-link-edit">Salvar</button>
            </div>
        </div>
    `;

    card.querySelector('.edit-link-url').focus();

    card.querySelector('.btn-cancel-link-edit').onclick = () => loadLinks(currentUserId);

    card.querySelector('.btn-save-link-edit').onclick = async () => {
        let url   = card.querySelector('.edit-link-url').value.trim();
        const title    = card.querySelector('.edit-link-title').value.trim();
        const category = card.querySelector('.edit-link-cat').value.trim();

        if (!url) return showModal("A URL é obrigatória.");
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        try { new URL(url); } catch { return showModal("URL inválida."); }

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
        }
    };
}

async function saveLinkOrder(userId) {
    const list = el('linkList');
    if (!list) return;
    const cards = [...list.querySelectorAll('.link-card')];
    try {
        const batch = writeBatch(db);
        cards.forEach((card, i) => {
            const id = card.dataset.id;
            if (id) batch.update(doc(db, 'users', userId, 'links', id), { order: i + 1 });
        });
        await batch.commit();
        // Atualiza allLinks com nova ordem para manter consistência
        const newOrder = {};
        cards.forEach((card, i) => { if (card.dataset.id) newOrder[card.dataset.id] = i + 1; });
        allLinks.forEach(l => { if (newOrder[l.id] !== undefined) l.order = newOrder[l.id]; });
    } catch (err) {
        console.error("Erro ao salvar ordem dos links:", err);
    }
}

function filterLinks(query) {
    const list = el('linkList');
    if (!query) {
        renderLinks(list, allLinks);
        return;
    }
    const filtered = allLinks.filter(l =>
        `${l.title} ${l.url} ${l.category}`.toLowerCase().includes(query)
    );
    if (filtered.length === 0) {
        list.innerHTML = '<p class="sub center">Nenhum link encontrado.</p>';
    } else {
        renderLinks(list, filtered);
    }
}
