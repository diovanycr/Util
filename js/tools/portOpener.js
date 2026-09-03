// ============================================================
//  portOpener.js — Port Opener integrado ao PainelAtende
// ============================================================
//  Entry point: agrega todos os tool panels e coordena o Port Opener
//  (lógica de portas em port-opener/ports.js, geração em generator.js,
//  HTML em builders.js).

import { bindEscPosEvents, buildEscPosPanel, resetEscPosState } from './escPos.js';
import { bindDocValidatorEvents, buildDocValidatorPanel } from './docValidatorUI.js';
import { bindStatusCheckerEvents, buildStatusCheckerPanel } from './statusChecker.js';
import { bindApiTesterEvents, buildApiTesterPanel } from './apiTester.js';
import { bindFileValidatorEvents, buildFileValidatorPanel } from './fileValidator.js';
import { bindTicketSummaryEvents, buildTicketSummaryPanel } from './ticketSummary.js';
import { bindDecisionTreeEvents, buildDecisionTreePanel } from './decisionTree.js';
import { bindNetworkDiagEvents, buildNetworkDiagPanel } from './networkDiag.js';
import { bindScriptGenEvents, buildScriptGenPanel } from './scriptGen.js';
import { FuturaSearchWidget } from './futura-widget.js';
import { auth } from '../core/firebase.js';
import { setupSegmented, createHighlighter, setCode as setHighlightedCode, setupOutputTabs } from '../core/utils.js';

import { DEFAULT_STATE } from './port-opener/constants.js';
import { buildPortOpenerPanel, buildFuturaPanel } from './port-opener/builders.js';
import {
  renderBat, renderPs1, renderNetsh, renderUndo, buildSummary
} from './port-opener/generator.js';
import {
  tryAddPort, removePort, renderTags, renderQuickPorts, syncQuick, shakeField
} from './port-opener/ports.js';

// Estado mutável da sessão (Port Opener)
const state = { ...DEFAULT_STATE };

let _escapeHandler = null;
let _futuraWidget = null;
let _logoutHandler = null;

const TOOL_TITLES = {
  portopener: '🛡️ Port Opener',
  futura: '🔍 Futura Search',
  escpos: '🖨️ ESC/POS',
  docvalidator: '📋 Documentos Fiscais',
  statuschecker: '🟢 Status SEFAZ & Gateways',
  apitester: '🔌 Testes de APIs & Webhooks',
  filevalidator: '📂 Arquivos Fiscais & Ponto',
  ticketsummary: '📝 Sumário de Atendimento',
  decisiontree: '🌳 Árvore de Decisão',
  networkdiag: '🌐 Diagnóstico de Redes',
  scriptgen: '⚡ Scripts & Comandos'
};

// ── Seletor de ferramentas ────────────────────────────────────────────────
function _buildToolSelector() {
  return `
    <div class="card po-tool-selector">
      <p class="po-selector-label">Escolha uma ferramenta</p>
      <div class="po-tools-grid">
        <button class="po-tool-btn active" data-tool="portopener">
          <span class="po-tool-icon">🛡️</span>
          <span class="po-tool-name">Port Opener</span>
          <span class="po-tool-desc">Gera scripts para abrir portas no Firewall do Windows</span>
        </button>
        <button class="po-tool-btn" data-tool="futura">
          <span class="po-tool-icon">🔍</span>
          <span class="po-tool-name">Futura Search</span>
          <span class="po-tool-desc">Pesquise no manual e tire dúvidas do sistema com IA</span>
        </button>
        <button class="po-tool-btn" data-tool="escpos">
          <span class="po-tool-icon">🖨️</span>
          <span class="po-tool-name">ESC/POS</span>
          <span class="po-tool-desc">Gera comandos brutos de corte, gaveta e avanço para impressoras térmicas</span>
        </button>
        <button class="po-tool-btn" data-tool="docvalidator">
          <span class="po-tool-icon">📋</span>
          <span class="po-tool-name">Documentos Fiscais</span>
          <span class="po-tool-desc">Valide e gere CPF, CNPJ, PIS, IE e Chave NFe/NFCe</span>
        </button>
        <button class="po-tool-btn" data-tool="statuschecker">
          <span class="po-tool-icon">🟢</span>
          <span class="po-tool-name">Status SEFAZ & Gateways</span>
          <span class="po-tool-desc">Verifica disponibilidade dos serviços SEFAZ e adquirentes</span>
        </button>
        <button class="po-tool-btn" data-tool="apitester">
          <span class="po-tool-icon">🔌</span>
          <span class="po-tool-name">Testes de APIs & Webhooks</span>
          <span class="po-tool-desc">Teste endpoints REST/Webhooks: WooCommerce, VTEX, Mercado Livre</span>
        </button>
        <button class="po-tool-btn" data-tool="filevalidator">
          <span class="po-tool-icon">📂</span>
          <span class="po-tool-name">Arquivos Fiscais & Ponto</span>
          <span class="po-tool-desc">Valide XML de NFe/NFCe, parse de AFD/AFDT e extração de CNPJ/IE</span>
        </button>
        <button class="po-tool-btn" data-tool="ticketsummary">
          <span class="po-tool-icon">📝</span>
          <span class="po-tool-name">Sumário de Atendimento</span>
          <span class="po-tool-desc">Gere resumos padronizados para Tickets/CRM</span>
        </button>
        <button class="po-tool-btn" data-tool="decisiontree">
          <span class="po-tool-icon">🌳</span>
          <span class="po-tool-name">Árvore de Decisão</span>
          <span class="po-tool-desc">Guias interativos para diagnosticar falhas em PDV, Impressora, Ponto e E-commerce</span>
        </button>
        <button class="po-tool-btn" data-tool="networkdiag">
          <span class="po-tool-icon">🌐</span>
          <span class="po-tool-name">Diagnóstico de Redes</span>
          <span class="po-tool-desc">Calculadora IP/Subrede e testador de portas TCP para impressoras, balanças e REPs</span>
        </button>
        <button class="po-tool-btn" data-tool="scriptgen">
          <span class="po-tool-icon">⚡</span>
          <span class="po-tool-name">Scripts & Comandos</span>
          <span class="po-tool-desc">Gere SQL, BAT e PowerShell com variáveis dinâmicas para suporte</span>
        </button>
      </div>
    </div>
    <div id="poToolModal" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-label="Ferramenta">
      <div class="po-modal-box card">
        <div class="po-modal-header">
          <h3 id="poModalTitle" class="po-modal-title">Ferramenta</h3>
          <button type="button" id="poModalClose" class="po-modal-close" aria-label="Fechar ferramenta">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
        <div id="poModalBody" class="po-modal-body"></div>
      </div>
    </div>
  `;
}

// ── Render da aba Sistemas ────────────────────────────────────────────────
export function renderSistemasTab(container) {
  resetEscPosState();
  container.innerHTML = `
    <div class="po-wrap">
      ${_buildToolSelector()}
      ${buildPortOpenerPanel()}
      ${buildEscPosPanel()}
      ${buildDocValidatorPanel()}
      ${buildStatusCheckerPanel()}
      ${buildApiTesterPanel()}
      ${buildFileValidatorPanel()}
      ${buildTicketSummaryPanel()}
      ${buildDecisionTreePanel()}
      ${buildNetworkDiagPanel()}
      ${buildScriptGenPanel()}
      ${buildFuturaPanel()}
    </div><!-- /po-wrap -->
  `;

  _bindEvents(container);
  _renderAllPorts();
  bindEscPosEvents(container);
  bindDocValidatorEvents(container);
  bindStatusCheckerEvents(container);
  bindApiTesterEvents(container);
  bindFileValidatorEvents(container);
  bindTicketSummaryEvents(container);
  bindDecisionTreeEvents(container);
  bindNetworkDiagEvents(container);
  bindScriptGenEvents(container);

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const futContainer = document.getElementById('futuraSearchWidgetContainer');
  if (futContainer) futContainer.setAttribute('data-theme', currentTheme);

  _futuraWidget = new FuturaSearchWidget({ containerId: 'futuraSearchWidgetContainer', userId: auth.currentUser?.uid || '' });

  _logoutHandler = () => cleanupPortOpener();
  document.addEventListener('user-logout', _logoutHandler);
}

// ── Atualização visual das portas (chamado sempre que state.ports muda) ────
function _renderAllPorts() {
  renderTags(state.ports, () => _handleRemove());
  renderQuickPorts(state.ports, () => _handleToggleQuick());
  syncQuick(state.ports);
}

function _handleRemove() {
  return (num) => { removePort(state.ports, num, { onChange: _renderAllPorts }); };
}

function _handleToggleQuick() {
  return (num, label) => {
    const existing = state.ports.find(p=>p.num===num);
    if (existing) removePort(state.ports, num, { onChange: _renderAllPorts });
    else { state.ports.push({num, label}); _renderAllPorts(); }
  };
}

// ── Modal de ferramentas ──────────────────────────────────────────────────
let _toolModalReturnFocus = null;
let _focusTrapHandler = null;

function _setupFocusTrap(modal) {
  _removeFocusTrap();
  _focusTrapHandler = (e) => {
    if (e.key !== 'Tab' || modal.classList.contains('hidden')) return;
    const focusables = [...modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter(el => !el.disabled && el.offsetWidth > 0 && el.offsetHeight > 0);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  };
  document.addEventListener('keydown', _focusTrapHandler);
}

function _removeFocusTrap() {
  if (_focusTrapHandler) {
    document.removeEventListener('keydown', _focusTrapHandler);
    _focusTrapHandler = null;
  }
}

function _openToolModal(tool, btnEl) {
  const modal = document.getElementById('poToolModal');
  const body = document.getElementById('poModalBody');
  const titleEl = document.getElementById('poModalTitle');
  if (!modal || !body) return;

  _toolModalReturnFocus = btnEl;
  titleEl.textContent = TOOL_TITLES[tool] || 'Ferramenta';

  // Move o painel da ferramenta para dentro do corpo do modal (preserva listeners)
  const panel = document.getElementById(`poTool-${tool}`);
  const typedBody = /** @type {HTMLElement & { _currentPanel?: HTMLElement|null }} */ (body);
  if (panel) {
    // Devolve painel anterior ao container original (se houver)
    const wrap = document.querySelector('.po-wrap');
    if (typedBody._currentPanel && wrap) {
      typedBody._currentPanel.classList.add('hidden');
      wrap.appendChild(typedBody._currentPanel);
    }
    panel.classList.remove('hidden');
    typedBody.appendChild(panel);
    typedBody._currentPanel = panel;
  }

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  _setupFocusTrap(modal);
  const closeBtn = document.getElementById('poModalClose');
  if (closeBtn) closeBtn.focus();
}

function _closeToolModal(container) {
  const modal = document.getElementById('poToolModal');
  const body = document.getElementById('poModalBody');
  if (!modal) return;

  _removeFocusTrap();

  // Devolve o painel ao container original (oculto)
  const wrap = document.querySelector('.po-wrap');
  const typedBody = /** @type {HTMLElement & { _currentPanel?: HTMLElement|null }} */ (body);
  if (typedBody?._currentPanel && wrap) {
    typedBody._currentPanel.classList.add('hidden');
    wrap.appendChild(typedBody._currentPanel);
    typedBody._currentPanel = null;
  }

  modal.classList.add('hidden');
  modal.style.display = 'none';
  // Desmarca ativo no seletor
  container.querySelectorAll('.po-tool-btn').forEach(b => b.classList.remove('active'));
  if (_toolModalReturnFocus) _toolModalReturnFocus.focus();
  _toolModalReturnFocus = null;
}

// ── Bind de eventos ───────────────────────────────────────────────────────
function _bindEvents(container) {

  // Seletor de ferramenta
  container.querySelectorAll('.po-tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.po-tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _openToolModal(/** @type {HTMLElement} */ (btn).dataset.tool, btn);
    });
  });

  // Fecha modal: botão X, clique no overlay, Escape
  document.getElementById('poModalClose')?.addEventListener('click', () => _closeToolModal(container));
  document.getElementById('poToolModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) _closeToolModal(container);
  });
  _escapeHandler = (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('poToolModal');
      if (modal && !modal.classList.contains('hidden')) _closeToolModal(container);
    }
  };
  document.addEventListener('keydown', _escapeHandler);

  // Tag field: click foca input
  document.getElementById('poTagField')?.addEventListener('click', () =>
    document.getElementById('poPortInput')?.focus()
  );

  // Input de porta
  const input = /** @type {HTMLInputElement|null} */ (document.getElementById('poPortInput'));
  if (input) {
    input.addEventListener('keydown', e => {
      if (['Enter', ','].includes(e.key)) { e.preventDefault(); tryAddPort(state.ports, input.value.trim(), { onChange: _renderAllPorts }); }
      if (e.key === 'Backspace' && input.value === '' && state.ports.length > 0)
        removePort(state.ports, state.ports[state.ports.length - 1].num, { onChange: _renderAllPorts });
    });
    input.addEventListener('input', () => {
      const v = input.value;
      if (v.endsWith(',') || v.endsWith(' ')) tryAddPort(state.ports, v.replace(/[, ]/g,'').trim(), { onChange: _renderAllPorts });
    });
  }

  // Segmented controls (radiogroup): clique + navegação por setas + aria-checked
  setupSegmented(document.getElementById('poSegProto'), btn => { state.proto = btn.dataset.v; });
  setupSegmented(document.getElementById('poSegDir'),   btn => { state.dir   = btn.dataset.v; });

  // Gerar
  document.getElementById('poBtnGenerate')?.addEventListener('click', _generate);

  // Output tabs (delegação) com aria-selected e tabindex
  setupOutputTabs(container, '.po-otab', 'poPane-', '#poTool-portopener');

  container.addEventListener('click', e => {
    const copyBtn = /** @type {HTMLElement|null} */ (/** @type {HTMLElement} */ (e.target).closest?.('.po-btn-copy'));
    if (copyBtn && copyBtn.dataset.id) {
      const targetEl = /** @type {HTMLElement & { _raw?: string }} */ (document.getElementById(copyBtn.dataset.id));
      if (targetEl) {
        navigator.clipboard.writeText(targetEl._raw || targetEl.textContent || '').then(() => {
          const prev = copyBtn.innerHTML;
          copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado';
          copyBtn.classList.add('po-copied');
          setTimeout(() => { copyBtn.innerHTML = prev; copyBtn.classList.remove('po-copied'); }, 2000);
        });
      }
    }

    // Download
    const dlBtn = /** @type {HTMLElement|null} */ (/** @type {HTMLElement} */ (e.target).closest?.('.po-btn-dl'));
    if (dlBtn && dlBtn.dataset.id) {
      const targetEl = /** @type {HTMLElement & { _raw?: string }} */ (document.getElementById(dlBtn.dataset.id));
      if (targetEl) {
        const text = targetEl._raw || targetEl.textContent || '';
        const a = Object.assign(document.createElement('a'), {
          href: URL.createObjectURL(new Blob([text], {type:'text/plain'})),
          download: dlBtn.dataset.name
        });
        a.click(); URL.revokeObjectURL(a.href);
      }
    }
  });
}

export function cleanupPortOpener() {
  _removeFocusTrap();
  if (_escapeHandler) {
    document.removeEventListener('keydown', _escapeHandler);
    _escapeHandler = null;
  }
  if (_futuraWidget) {
    _futuraWidget.destroy();
    _futuraWidget = null;
  }
  if (_logoutHandler) {
    document.removeEventListener('user-logout', _logoutHandler);
    _logoutHandler = null;
  }
}

// ── Geração dos scripts ───────────────────────────────────────────────────
function _generate() {
  if (state.ports.length === 0) { shakeField(); document.getElementById('poPortInput').focus(); return; }

  _setCode('poRaw-bat',   renderBat(state.ports, state.proto, state.dir));
  _setCode('poRaw-ps1',   renderPs1(state.ports, state.proto, state.dir));
  _setCode('poRaw-netsh', renderNetsh(state.ports, state.proto, state.dir));
  _setCode('poRaw-undo',  renderUndo(state.ports, state.proto, state.dir));

  const summary = buildSummary(state.ports, state.proto, state.dir);
  document.getElementById('poSummaryText').textContent = summary.text;
  document.getElementById('poSummaryTags').innerHTML = summary.tagsHTML;

  const poTabs = document.querySelectorAll('#poTool-portopener .po-otab');
  poTabs.forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
    t.setAttribute('tabindex', '-1');
  });
  document.querySelectorAll('#poTool-portopener .po-pane').forEach(p => p.classList.add('hidden'));
  const firstTab = poTabs[0];
  if (firstTab) {
    firstTab.classList.add('active');
    firstTab.setAttribute('aria-selected', 'true');
    firstTab.setAttribute('tabindex', '0');
  }
  document.getElementById('poPane-bat')?.classList.remove('hidden');

  const out = document.getElementById('poOutput');
  out.classList.remove('hidden');
  setTimeout(() => out.scrollIntoView({behavior:'smooth', block:'start'}), 50);
}


// ── Highlight de sintaxe ──────────────────────────────────────────────────
// Tokens são extraídos primeiro (com placeholders), para que regex posteriores
// não apliquem spans DENTRO de spans já criados (HTML malformado).
const _hl = createHighlighter([
  // 1) Comentários (linha iniciando com :: , # , @echo off) — preserva prefixo
  { regex: /(^|\n)(:: ?.*|# .*|@echo off)/g, transform: (m, p, c, stash, span) => `${p}${stash(span('cmt', c))}` },
  // 2) Strings "..."
  { regex: /"([^"]*)"/g, cls: 'str' },
  // 3) Variáveis PowerShell ($var)
  { regex: /(\$[\w.[\]]+)/g, cls: 'var' },
  // 4) Comandos (palavras-chave)
  { regex: /\b(netsh|advfirewall|firewall|add|delete|rule|New-NetFirewallRule|Remove-NetFirewallRule|Write-Host|Write-Error|net|session|if|exit|pause|echo)\b/g, cls: 'cmd' },
  // 5) Argumentos/valores
  { regex: /\b(action|allow|block|dir|in|out|protocol|localport|enable|yes|profile|any|TCP|UDP|Inbound|Outbound|True|False|Allow)\b/g, cls: 'kw' },
  // 6) Números (portas)
  { regex: /\b(\d{1,5})\b/g, cls: 'num' }
]);

function _setCode(id, text) {
  setHighlightedCode(id, text, _hl);
}
