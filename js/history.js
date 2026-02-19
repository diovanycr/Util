// ============================================================
//  history.js — Histórico de cópias (localStorage)
// ============================================================

const HISTORY_KEY  = 'painelAtende_copyHistory';
const MAX_HISTORY  = 20;

// --- API pública ---

export function addToHistory(text, title = '', category = '') {
    const history = getHistory();
    // Remove duplicata se já existir
    const filtered = history.filter(h => h.text !== text);
    filtered.unshift({ text, title, category, copiedAt: Date.now() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, MAX_HISTORY)));
}

export function getHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch { return []; }
}

export function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
}

// --- UI ---

export function initHistory() {
    _injectButton();
    _injectPanel();
}

function _injectButton() {
    // Adiciona botão "Histórico" na toolbar de mensagens, após o Exportar
    const toolbar = document.querySelector('#tabMessages .toolbar');
    if (!toolbar || document.getElementById('btnHistory')) return;

    const btn = document.createElement('button');
    btn.id = 'btnHistory';
    btn.className = 'btn ghost';
    btn.title = 'Histórico de cópias';
    btn.innerHTML = '<i class="fa-solid fa-clock-rotate-left"></i> Histórico';
    btn.onclick = toggleHistoryPanel;

    // Insere antes do botão "Nova mensagem"
    const btnNew = document.getElementById('btnNewMsg');
    toolbar.insertBefore(btn, btnNew);
}

function _injectPanel() {
    if (document.getElementById('historyPanel')) return;

    const panel = document.createElement('div');
    panel.id = 'historyPanel';
    panel.className = 'card hidden mt-16';
    panel.innerHTML = `
        <div class="history-header">
            <h3><i class="fa-solid fa-clock-rotate-left"></i> Histórico de cópias</h3>
            <div style="display:flex;gap:8px;">
                <button id="btnClearHistory" class="btn ghost" title="Limpar histórico">
                    <i class="fa-solid fa-trash"></i> Limpar
                </button>
                <button id="btnCloseHistory" class="btn ghost">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        </div>
        <div id="historyList" class="history-list mt-12"></div>
    `;

    // Insere antes da msgList
    const msgList = document.getElementById('msgList');
    msgList?.parentNode.insertBefore(panel, msgList);

    document.getElementById('btnCloseHistory').onclick = closeHistoryPanel;
    document.getElementById('btnClearHistory').onclick = () => {
        clearHistory();
        renderHistoryPanel();
    };
}

export function toggleHistoryPanel() {
    const panel = document.getElementById('historyPanel');
    if (!panel) return;
    const isHidden = panel.classList.contains('hidden');
    if (isHidden) {
        panel.classList.remove('hidden');
        renderHistoryPanel();
    } else {
        closeHistoryPanel();
    }
}

export function closeHistoryPanel() {
    document.getElementById('historyPanel')?.classList.add('hidden');
}

export function renderHistoryPanel() {
    const list = document.getElementById('historyList');
    if (!list) return;

    const history = getHistory();
    if (history.length === 0) {
        list.innerHTML = '<p class="sub center">Nenhuma cópia registrada ainda.</p>';
        return;
    }

    list.innerHTML = '';
    history.forEach((item, i) => {
        const row = document.createElement('div');
        row.className = 'history-item';

        const time = _formatTime(item.copiedAt);
        const titleHtml = item.title
            ? `<span class="history-item-title">${_esc(item.title)}</span>`
            : '';
        const catHtml = item.category && item.category !== 'Geral'
            ? `<span class="history-item-cat">${_esc(item.category)}</span>`
            : '';

        row.innerHTML = `
            <div class="history-item-body">
                <div class="history-item-meta">
                    ${titleHtml}
                    ${catHtml}
                    <span class="history-item-time"><i class="fa-regular fa-clock"></i> ${time}</span>
                </div>
                <div class="history-item-text">${_esc(item.text)}</div>
            </div>
            <button class="btn ghost history-copy-btn" title="Copiar novamente">
                <i class="fa-solid fa-copy"></i>
            </button>
        `;

        row.querySelector('.history-copy-btn').onclick = async () => {
            await navigator.clipboard.writeText(item.text);
            addToHistory(item.text, item.title, item.category);
            // Feedback visual
            const btn = row.querySelector('.history-copy-btn');
            btn.innerHTML = '<i class="fa-solid fa-check"></i>';
            btn.style.color = 'var(--success)';
            setTimeout(() => {
                btn.innerHTML = '<i class="fa-solid fa-copy"></i>';
                btn.style.color = '';
                renderHistoryPanel();
            }, 1200);
        };

        list.appendChild(row);
    });
}

// --- helpers ---

function _formatTime(ts) {
    const now = Date.now();
    const diff = now - ts;
    if (diff < 60000)  return 'agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
    return new Date(ts).toLocaleDateString('pt-BR');
}

function _esc(str) {
    return String(str)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;');
}
