// ============================================================
//  statusChecker.js — Checador de Status SEFAZ & Gateways
// ============================================================
//  Verifica disponibilidade de serviços SEFAZ (NFe/NFCe por UF)
//  e gateways de pagamento (Stone, PagBank, Mercado Pago, TEF)

import { setupSegmented } from './utils.js';

const SEFAZ_SERVICES = [
    { uf: 'AC', url: 'https://www.sefaznet.ac.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-AC' },
    { uf: 'AL', url: 'https://www.sefaz.al.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-AL' },
    { uf: 'AP', url: 'https://www.sefaz.ap.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-AP' },
    { uf: 'AM', url: 'https://www.sefaz.am.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-AM' },
    { uf: 'BA', url: 'https://www.sefaz.ba.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-BA' },
    { uf: 'CE', url: 'https://www.sefaz.ce.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-CE' },
    { uf: 'DF', url: 'https://www.fazenda.df.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-DF' },
    { uf: 'ES', url: 'https://www.sefaz.es.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-ES' },
    { uf: 'GO', url: 'https://www.sefaz.go.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-GO' },
    { uf: 'MA', url: 'https://www.sefaz.ma.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-MA' },
    { uf: 'MT', url: 'https://www.sefaz.mt.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-MT' },
    { uf: 'MS', url: 'https://www.dfe.ms.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-MS' },
    { uf: 'MG', url: 'https://www.nfe.fazenda.mg.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-MG' },
    { uf: 'PA', url: 'https://www.sefa.pa.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-PA' },
    { uf: 'PB', url: 'https://www.receita.pb.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-PB' },
    { uf: 'PR', url: 'https://www.sefanet.pr.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-PR' },
    { uf: 'PE', url: 'https://www.sefe.pe.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-PE' },
    { uf: 'PI', url: 'https://www.sefaz.pi.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-PI' },
    { uf: 'RJ', url: 'https://www.fazenda.rj.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-RJ' },
    { uf: 'RN', url: 'https://www.set.rn.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-RN' },
    { uf: 'RS', url: 'https://www.sefaz.rs.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-RS' },
    { uf: 'RO', url: 'https://www.sefaz.ro.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-RO' },
    { uf: 'RR', url: 'https://www.sefaz.rr.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-RR' },
    { uf: 'SC', url: 'https://www.sefaz.sc.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-SC' },
    { uf: 'SP', url: 'https://www.nfe.fazenda.sp.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-SP' },
    { uf: 'SE', url: 'https://www.sefaz.se.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-SE' },
    { uf: 'TO', url: 'https://www.sefaz.to.gov.br/nfe/nfe_app.aspx', name: 'SEFAZ-TO' },
];

const GATEWAYS = [
    { id: 'stone',     name: 'Stone',       url: 'https://api.stone.com.br/healthcheck', statusUrl: 'https://status.stone.com.br' },
    { id: 'pagbank',   name: 'PagBank',     url: 'https://api.pagseguro.com/health',     statusUrl: 'https://status.pagseguro.com.br' },
    { id: 'mercadopago', name: 'Mercado Pago', url: 'https://api.mercadopago.com/health',  statusUrl: 'https://status.mercadopago.com' },
    { id: 'cielo',     name: 'Cielo',        url: 'https://api.cieloecommerce.cielo.com.br/health', statusUrl: 'https://status.cielo.com.br' },
    { id: 'rede',      name: 'Rede',         url: 'https://api.userede.com.br/health',   statusUrl: 'https://status.userede.com.br' },
    { id: 'getnet',    name: 'Getnet',       url: 'https://api.getnet.com.br/health',     statusUrl: 'https://status.getnet.com.br' },
];

let scTimeout = 8000;

export function buildStatusCheckerPanel() {
    return `
      <div id="poTool-statuschecker" class="po-tool-panel hidden">
        <div class="card">
          <div class="po-card-header">
            <span class="po-card-icon">🟢</span>
            <div>
              <h3 class="po-card-title">Checador de Status SEFAZ & Gateways</h3>
              <p class="sub">Verifica a disponibilidade dos serviços SEFAZ (NFe/NFCe por UF) e adquirentes</p>
            </div>
          </div>
        </div>

        <div class="card">
          <p class="po-section-label">Serviços para verificar</p>
          <div class="sc-tab-btns" id="scTabBtns">
            <button class="po-seg-btn active" role="radio" aria-checked="true" tabindex="0" data-cat="sefaz">SEFAZ por UF</button>
            <button class="po-seg-btn" role="radio" aria-checked="false" tabindex="-1" data-cat="gateways">Gateways de Pagamento</button>
          </div>
          <div class="sc-actions mt-10">
            <button id="scBtnCheckAll" class="btn primary"><i class="fa-solid fa-play"></i> Verificar todos</button>
            <label class="esc-check"><input type="checkbox" id="scAutoRefresh" /> <span>Auto-refresh (30s)</span></label>
          </div>
          <p class="sc-disclaimer mt-8"><i class="fa-solid fa-circle-info"></i> Devido a CORS, o teste verifica apenas se o servidor responde. Para detalhes completos, visite a <strong>página de status</strong> oficial.</p>
        </div>

        <div id="scGrid" class="sc-grid"></div>
      </div>
    `;
}

export function bindStatusCheckerEvents(container) {
    let currentCat = 'sefaz';
    let refreshTimer = null;

    const _renderGrid = (cat) => {
        const grid = container.querySelector('#scGrid');
        if (!grid) return;
        const items = cat === 'sefaz' ? SEFAZ_SERVICES : GATEWAYS;
        grid.innerHTML = items.map(item => {
            const id = cat === 'sefaz' ? `sefaz-${item.uf}` : `gw-${item.id}`;
            const label = cat === 'sefaz' ? item.uf : item.name;
            const subLabel = cat === 'sefaz' ? item.name : 'Gateway';
            return `
              <div class="sc-card" id="${id}">
                <div class="sc-card-header">
                  <span class="sc-label">${label}</span>
                  <span class="sc-status sc-status-unknown">⏳</span>
                </div>
                <p class="sc-sub">${subLabel}</p>
                <p class="sc-time">—</p>
                <div class="sc-actions-row">
                  <button class="btn ghost sc-btn-check" data-url="${item.url}" data-id="${id}"><i class="fa-solid fa-play"></i></button>
                  ${item.statusUrl ? `<a href="${item.statusUrl}" target="_blank" rel="noopener noreferrer" class="btn ghost sc-btn-link"><i class="fa-solid fa-up-right-from-square"></i></a>` : ''}
                </div>
              </div>`;
        }).join('');

        grid.querySelectorAll('.sc-btn-check').forEach(btn => {
            btn.addEventListener('click', () => _checkOne(btn.dataset.url, btn.dataset.id));
        });
    };

    // Abas categoria
    const tabs = container.querySelector('#scTabBtns');
    setupSegmented(tabs, btn => {
        currentCat = btn.dataset.cat;
        _renderGrid(currentCat);
    });

    container.querySelector('#scBtnCheckAll')?.addEventListener('click', () => {
        const items = currentCat === 'sefaz' ? SEFAZ_SERVICES : GATEWAYS;
        items.forEach(item => {
            const id = currentCat === 'sefaz' ? `sefaz-${item.uf}` : `gw-${item.id}`;
            _checkOne(item.url, id);
        });
    });

    const autoCheckbox = container.querySelector('#scAutoRefresh');
    if (autoCheckbox) {
        autoCheckbox.addEventListener('change', e => {
            if (e.target.checked) {
                refreshTimer = setInterval(() => {
                    container.querySelector('#scBtnCheckAll')?.click();
                }, 30000);
            } else {
                clearInterval(refreshTimer);
                refreshTimer = null;
            }
        });
    }

    _renderGrid('sefaz');
}

function _checkOne(url, cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    const statusEl = card.querySelector('.sc-status');
    const timeEl = card.querySelector('.sc-time');

    statusEl.className = 'sc-status sc-status-checking';
    statusEl.textContent = '🔄';
    timeEl.textContent = 'Verificando...';

    const start = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), scTimeout);

    fetch(url, { mode: 'no-cors', signal: controller.signal, redirect: 'follow' })
        .then(() => {
            const elapsed = Math.round(performance.now() - start);
            statusEl.className = 'sc-status sc-status-up';
            statusEl.textContent = '✅';
            timeEl.textContent = `${elapsed}ms (respondendo)`;
        })
        .catch(err => {
            const elapsed = Math.round(performance.now() - start);
            if (err.name === 'AbortError') {
                statusEl.className = 'sc-status sc-status-slow';
                statusEl.textContent = '⚠️';
                timeEl.textContent = `Timeout (${scTimeout / 1000}s)`;
            } else {
                // no-cors mode não permite ler a resposta, mas fetch sem erro = servidor online
                // Se fetch rejeita, provavelmente offline ou CORS bloqueando
                statusEl.className = 'sc-status sc-status-down';
                statusEl.textContent = '❌';
                timeEl.textContent = `Sem resposta (${elapsed}ms)`;
            }
        })
        .finally(() => clearTimeout(timeoutId));
}