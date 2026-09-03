import {
    db, el,
    collection, getDocs, query,
    doc, increment
} from '../core/firebase.js';
import { addDoc, writeBatch } from '../core/firebase-retry.js';
import { escapeHtml } from '../core/utils.js';
import { showToast } from '../core/toast.js';
import { initAnalytics, resetAnalytics } from './analytics.js';

let currentUserId = null;
let rankingInitialized = false;
let resetTimer = null;

export function initRanking(uid) {
    currentUserId = uid;
    if (!rankingInitialized) {
        rankingInitialized = true;
        document.addEventListener('copy-count-updated', () => loadRanking());
    }
    initAnalytics(uid);
    loadRanking();
    scheduleDailyReset();
}

export function resetRanking() {
    currentUserId = null;
    rankingInitialized = false;
    if (resetTimer) { clearTimeout(resetTimer); resetTimer = null; }
    resetAnalytics();
}

function scheduleDailyReset() {
    if (resetTimer) clearTimeout(resetTimer);
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();
    resetTimer = setTimeout(() => {
        if (Date.now() >= midnight.getTime()) {
            resetDailyCounts();
        }
        scheduleDailyReset();
    }, msUntilMidnight + 1000);
    if ('BroadcastChannel' in window) {
        try {
            const ch = new BroadcastChannel('painel-reset');
            ch.onmessage = () => loadRanking();
        } catch {}
    }
}

async function resetDailyCounts() {
    if (!currentUserId) return;
    try {
        const msgsRef = collection(db, 'users', currentUserId, 'messages');
        const snap = await getDocs(query(msgsRef));

        const auditEntries = [];
        const batch = writeBatch(db);
        let hasCounts = false;

        snap.forEach(d => {
            const data = d.data();
            if (data.deleted) return;
            const count = data.copyCount || 0;
            if (count > 0) {
                hasCounts = true;
                auditEntries.push({
                    messageId: d.id,
                    title: data.title || '',
                    text: (data.text || '').slice(0, 200),
                    category: data.category || 'Geral',
                    copyCount: count
                });
                batch.update(doc(msgsRef, d.id), { copyCount: 0 });
            }
        });

        if (hasCounts) {
            await addDoc(collection(db, 'users', currentUserId, 'auditReset'), {
                resetAt: Date.now(),
                date: new Date().toISOString().split('T')[0],
                totalCopies: auditEntries.reduce((s, e) => s + e.copyCount, 0),
                messages: auditEntries
            });
            await batch.commit();
            console.log('[Ranking] Contagens zeradas à meia-noite.', auditEntries.length, 'mensagens');
        }

        loadRanking();
    } catch (err) {
        console.error('Erro ao zerar contagens diárias:', err);
    }
}

export async function loadRanking() {
    const list = el('rankingList');
    if (!list) return;
    list.innerHTML = '<div class="empty-state-container"><i class="fa-solid fa-spinner fa-spin"></i><p class="empty-state-title">Carregando ranking...</p></div>';

    if (!currentUserId) return;

    try {
        const msgsRef = collection(db, 'users', currentUserId, 'messages');
        const snap = await getDocs(query(msgsRef));

        const items = [];
        snap.forEach(doc => {
            const data = doc.data();
            if (data.deleted) return;
            items.push({
                id: doc.id,
                copyCount: data.copyCount || 0,
                title: data.title || '',
                text: data.text || '',
                category: data.category || 'Geral'
            });
        });

        if (items.length === 0) {
            list.innerHTML = `
                <div class="empty-state-container">
                    <i class="fa-regular fa-message empty-state-icon"></i>
                    <p class="empty-state-title">Nenhuma mensagem encontrada</p>
                    <p class="empty-state-desc">Cadastre mensagens na aba Mensagens para gerar o ranking.</p>
                </div>
            `;
            return;
        }

        items.sort((a, b) => b.copyCount - a.copyCount);

        list.innerHTML = '';
        items.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'user-row';
            row.dataset.id = item.id;

            const displayText = item.text;

            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

            row.innerHTML = `
                <span class="drag-handle">${medal}</span>
                <div class="msg-content flex-1" tabindex="0" role="button" aria-label="Copiar mensagem: ${escapeHtml(item.text)}">
                    <span class="msg-title">${escapeHtml(item.title || 'Sem título')}</span>
                    <div class="msg-text">${escapeHtml(displayText)}</div>
                    <span class="sub" style="margin-left: 8px;">${item.copyCount} cópia${item.copyCount !== 1 ? 's' : ''}</span>
                </div>
                <span class="sub" style="min-width: 80px; text-align: right;">${item.category}</span>
            `;

            const msgContent = /** @type {HTMLElement|null} */ (row.querySelector('.msg-content'));
            if (msgContent) {
                msgContent.onclick = async () => {
                try {
                    const textToCopy = item.text.includes('{usuario}')
                        ? item.text.replace(/\{usuario\}/g, el('loggedUser')?.dataset?.username?.trim() || 'Usuário')
                        : item.text;
                    await navigator.clipboard.writeText(textToCopy);
                    showToast("Copiado!");
                } catch (err) {
                    console.error(err);
                }
            };
        }

            list.appendChild(row);
        });
    } catch (err) {
        console.error('Erro ao carregar ranking:', err);
        list.innerHTML = `
            <div class="empty-state-container">
                <i class="fa-solid fa-triangle-exclamation empty-state-icon"></i>
                <p class="empty-state-title">Erro ao carregar ranking</p>
                <p class="empty-state-desc">Tente recarregar a página.</p>
            </div>
        `;
    }
}