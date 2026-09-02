// ============================================================
//  apiTester.js — Central de Testes de APIs & Webhooks
// ============================================================
//  Testador rápido de endpoints REST/Webhooks para verificar
//  integrações com WooCommerce, VTEX, Mercado Livre, APIs Mobile

import { escapeHtml, escapeAttr, setStatusBadge, openConfirmModal } from '../core/modal.js';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const PRESETS = [
    { name: 'WooCommerce', url: 'https://exemplo.com.br/wp-json/wc/v3/orders', method: 'GET', headers: { 'Authorization': 'Basic SEU_TOKEN_BASE64' } },
    { name: 'VTEX', url: 'https://loja.myvtex.com/api/oms/pvt/orders', method: 'GET', headers: { 'X-VTEX-API-AppKey': 'SEU_APPKEY', 'X-VTEX-API-AppToken': 'SEU_APPTOKEN' } },
    { name: 'Mercado Livre', url: 'https://api.mercadolibre.com/sites/MLB/search?q=teste', method: 'GET', headers: { 'Authorization': 'Bearer SEU_TOKEN' } },
    { name: 'REST Genérico', url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'GET', headers: { 'Content-Type': 'application/json' } },
];

let atHistory = [];

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '::']);

function _isPrivateIPv4(host) {
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
    const parts = host.split('.').map(Number);
    if (parts.some(p => p < 0 || p > 255 || Number.isNaN(p))) return true;
    return (
        parts[0] === 10 ||
        parts[0] === 127 ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168) ||
        (parts[0] === 169 && parts[1] === 254) ||
        (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127)
    );
}

export function validateApiRequestUrl(rawUrl) {
    if (!rawUrl) return { ok: false, reason: 'URL vazia.' };
    let url;
    try { url = new URL(rawUrl); } catch { return { ok: false, reason: 'URL malformada.' }; }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        return { ok: false, reason: `Protocolo bloqueado (${url.protocol}). Use http ou https.` };
    }
    if (url.protocol === 'http:') {
        return { ok: false, reason: 'HTTP (sem TLS) bloqueado. Use https.' };
    }
    const host = url.hostname.toLowerCase();
    if (LOOPBACK_HOSTS.has(host)) {
        return { ok: false, reason: `Loopback bloqueado (${host}).` };
    }
    if (_isPrivateIPv4(host)) {
        return { ok: false, reason: `Endereço de rede privada bloqueado (${host}).` };
    }
    return { ok: true, host, url };
}

function _maskSensitiveHeaders(headers) {
    const masked = {};
    for (const [k, v] of Object.entries(headers || {})) {
        if (/authorization|cookie|x-api-key|api[-_]?token|apikey|access[-_]?token/i.test(k)) {
            masked[k] = typeof v === 'string' ? '••••••' : v;
        } else {
            masked[k] = v;
        }
    }
    return masked;
}

export function buildApiTesterPanel() {
    return `
      <div id="poTool-apitester" class="po-tool-panel hidden">
        <div class="card">
          <div class="po-card-header">
            <span class="po-card-icon">🔌</span>
            <div>
              <h3 class="po-card-title">Central de Testes de APIs & Webhooks</h3>
              <p class="sub">Teste endpoints REST/Webhooks para WooCommerce, VTEX, Mercado Livre e APIs Mobile</p>
            </div>
          </div>
        </div>

        <div class="card">
          <p class="po-section-label">Presets rápidos</p>
          <div class="at-presets">
            ${PRESETS.map((p, i) => `<button class="btn ghost at-preset-btn" data-preset="${i}">${p.name}</button>`).join('')}
          </div>
        </div>

        <div class="card">
          <p class="po-section-label">Requisição</p>
          <div class="at-method-row">
            <select id="atMethod" class="dv-select" style="max-width:120px;">
              ${METHODS.map(m => `<option value="${m}">${m}</option>`).join('')}
            </select>
            <input id="atUrl" type="text" class="dv-input" placeholder="https://api.exemplo.com/endpoint" />
          </div>

          <div class="po-opt-group mt-10">
            <p class="po-opt-label">Headers (JSON)</p>
            <textarea id="atHeaders" class="esc-textarea" rows="3" placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'></textarea>
          </div>

          <div class="po-opt-group mt-10">
            <p class="po-opt-label">Body (JSON)</p>
            <textarea id="atBody" class="esc-textarea" rows="4" placeholder='{"chave": "valor"}'></textarea>
          </div>

          <div class="at-actions mt-10">
            <button id="atBtnSend" class="btn primary" style="font-size:15px;padding:12px 24px;"><i class="fa-solid fa-paper-plane"></i> Enviar</button>
            <button id="atBtnClear" class="btn ghost"><i class="fa-solid fa-eraser"></i> Limpar</button>
          </div>
        </div>

        <div id="atResult" class="card hidden">
          <div class="at-result-header">
            <span id="atResultStatus" class="at-status-badge">—</span>
            <span id="atResultTime" class="at-time-badge"></span>
            <button class="btn ghost po-btn-copy" data-id="atResultBody"><i class="fa-solid fa-copy"></i> Copiar</button>
          </div>
          <pre id="atResultBody" class="at-result-pre"></pre>
        </div>

        <div id="atHistorySection" class="card hidden">
          <p class="po-section-label">Histórico</p>
          <div id="atHistoryList" class="at-history-list"></div>
        </div>
      </div>
    `;
}

export function bindApiTesterEvents(container) {
    container.addEventListener('click', e => {
        const presetBtn = e.target.closest('.at-preset-btn');
        if (presetBtn) {
            const preset = PRESETS[parseInt(presetBtn.dataset.preset)];
            if (preset) {
                container.querySelector('#atMethod').value = preset.method;
                container.querySelector('#atUrl').value = preset.url;
                container.querySelector('#atHeaders').value = JSON.stringify(preset.headers, null, 2);
                container.querySelector('#atBody').value = '';
            }
        }

        if (e.target.closest('#atBtnSend')) _send(container);
        if (e.target.closest('#atBtnClear')) _clear(container);

        const copyBtn = e.target.closest('.po-btn-copy');
        if (copyBtn && copyBtn.dataset.id === 'atResultBody') {
            const el = container.querySelector('#atResultBody');
            navigator.clipboard.writeText(el._raw || el.textContent).then(() => {
                const prev = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado';
                setTimeout(() => { copyBtn.innerHTML = prev; }, 2000);
            });
        }
    });

    }

function _clear(container) {
    container.querySelector('#atUrl').value = '';
    container.querySelector('#atHeaders').value = '';
    container.querySelector('#atBody').value = '';
    container.querySelector('#atResult')?.classList.add('hidden');
}

function _send(container) {
    const method = container.querySelector('#atMethod').value;
    const url = container.querySelector('#atUrl').value.trim();
    const headersText = container.querySelector('#atHeaders').value.trim();
    const bodyText = container.querySelector('#atBody').value.trim();

    if (!url) { _showError(container, 'Digite uma URL.'); return; }

    const check = validateApiRequestUrl(url);
    if (!check.ok) { _showError(container, `Requisição bloqueada: ${check.reason}`); return; }

    let headers = {};
    if (headersText) {
        try { headers = JSON.parse(headersText); }
        catch { _showError(container, 'Headers inválidos. Use JSON válido.'); return; }
    }

    const proceed = () => _executeRequest(container, method, url, headers, bodyText);
    const needsConfirm = method !== 'GET' || Object.keys(headers).length > 0 || bodyText.length > 0;
    if (!needsConfirm) { proceed(); return; }

    openConfirmModal(
        proceed,
        null,
        `Enviar ${method} para ${check.host}?`,
        'Enviar',
        'Cancelar'
    );
}

function _executeRequest(container, method, url, headers, bodyText) {
    const result = container.querySelector('#atResult');
    const statusEl = container.querySelector('#atResultStatus');
    const timeEl = container.querySelector('#atResultTime');
    const bodyEl = container.querySelector('#atResultBody');

    result.classList.remove('hidden');
    setStatusBadge(statusEl, 'pending', '⏳ Enviando...');
    timeEl.textContent = '';
    bodyEl.textContent = 'Aguardando resposta...';

    const start = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const options = { method, headers, signal: controller.signal };
    if (method !== 'GET' && method !== 'DELETE' && bodyText) {
        try { options.body = JSON.stringify(JSON.parse(bodyText)); }
        catch { options.body = bodyText; }
    }

    fetch(url, options)
        .then(async res => {
            const elapsed = Math.round(performance.now() - start);
            const text = await res.text();
            let formatted = text;
            try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch {}

            setStatusBadge(statusEl, res.ok ? 'ok' : 'error', `${res.status} ${res.statusText || ''}`.trim());
            timeEl.textContent = `${elapsed}ms`;
            bodyEl._raw = formatted;
            bodyEl.textContent = formatted;

            _addToHistory(container, method, url, res.status, elapsed);
        })
        .catch(err => {
            const elapsed = Math.round(performance.now() - start);
            if (err.name === 'AbortError') {
                setStatusBadge(statusEl, 'error', '⏱ Timeout (15s)');
                timeEl.textContent = `${elapsed}ms`;
                bodyEl.textContent = 'A requisição excedeu o tempo limite. Verifique a URL, CORS ou disponibilidade do servidor.';
            } else {
                setStatusBadge(statusEl, 'error', '❌ Erro');
                timeEl.textContent = `${elapsed}ms`;
                bodyEl.textContent = `Erro: ${err.message}\n\nPossíveis causas:\n- URL incorreta ou servidor offline\n- CORS bloqueando a requisição\n- Certificado SSL inválido\n- Erro de rede`;
            }
        })
        .finally(() => clearTimeout(timeoutId));
}

function _showError(container, msg) {
    const result = container.querySelector('#atResult');
    const statusEl = container.querySelector('#atResultStatus');
    const timeEl = container.querySelector('#atResultTime');
    const bodyEl = container.querySelector('#atResultBody');
    result.classList.remove('hidden');
    setStatusBadge(statusEl, 'error', '❌ Erro');
    timeEl.textContent = '';
    bodyEl.textContent = msg;
}

function _addToHistory(container, method, url, status, time) {
    atHistory.unshift({ method, url, status, time, timestamp: new Date().toLocaleTimeString('pt-BR') });
    if (atHistory.length > 10) atHistory = atHistory.slice(0, 10);

    const section = container.querySelector('#atHistorySection');
    const list = container.querySelector('#atHistoryList');
    if (!section || !list) return;

    section.classList.remove('hidden');
    list.innerHTML = atHistory.map(h => `
        <div class="at-history-item">
            <span class="at-h-method">${escapeHtml(h.method)}</span>
            <span class="at-h-status ${h.status >= 200 && h.status < 300 ? 'at-status-ok-text' : 'at-status-error-text'}">${escapeHtml(h.status)}</span>
            <span class="at-h-url" title="${escapeAttr(h.url)}">${escapeHtml(h.url)}</span>
            <span class="at-h-time">${escapeHtml(h.time)}ms</span>
            <span class="at-h-ts">${escapeHtml(h.timestamp)}</span>
        </div>
    `).join('');
}