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
    doc
} from './firebase.js';

import { showModal } from './modal.js';
import { showToast } from './toast.js';
import { escapeHtml, escapeAttr } from './utils.js';

let currentUserId = null;
let allLinks = [];
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
            .sort((a, b) => (a.category || '').localeCompare(b.category || '') || (a.createdAt || 0) - (b.createdAt || 0));

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
                <button class="btn ghost link-del-btn" title="Remover link">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;

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

            group.appendChild(card);
        });

        container.appendChild(group);
    });
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
