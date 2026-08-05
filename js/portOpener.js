// ============================================================
//  portOpener.js — Port Opener integrado ao PainelAtende
// ============================================================
//  Entry point: agrega todos os tool panels e coordena o Port Opener
//  (lógica de portas em port-opener/ports.js, geração em generator.js,
//  HTML em builders.js).

import { bindEscPosEvents, buildEscPosPanel } from './escPos.js';
import { bindDocValidatorEvents, buildDocValidatorPanel } from './docValidatorUI.js';
import { bindStatusCheckerEvents, buildStatusCheckerPanel } from './statusChecker.js';
import { bindApiTesterEvents, buildApiTesterPanel } from './apiTester.js';
import { bindFileValidatorEvents, buildFileValidatorPanel } from './fileValidator.js';
import { bindTicketSummaryEvents, buildTicketSummaryPanel } from './ticketSummary.js';
import { bindDecisionTreeEvents, buildDecisionTreePanel } from './decisionTree.js';
import { bindNetworkDiagEvents, buildNetworkDiagPanel } from './networkDiag.js';
import { bindScriptGenEvents, buildScriptGenPanel } from './scriptGen.js';
import { FuturaSearchWidget } from './futura-widget.js';
import { auth } from './firebase.js';
import { setupSegmented, createHighlighter, setCode as setHighlightedCode } from './utils.js';

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
  `;
}

// ── Render da aba Sistemas ────────────────────────────────────────────────
export function renderSistemasTab(container) {
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

  new FuturaSearchWidget({ containerId: 'futuraSearchWidgetContainer', userId: auth.currentUser?.uid || '' });
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

// ── Bind de eventos ───────────────────────────────────────────────────────
function _bindEvents(container) {

  // Seletor de ferramenta
  container.querySelectorAll('.po-tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.po-tool-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.po-tool-panel').forEach(p => p.classList.add('hidden'));
      btn.classList.add('active');
      document.getElementById(`poTool-${btn.dataset.tool}`)?.classList.remove('hidden');
    });
  });

  // Tag field: click foca input
  document.getElementById('poTagField').addEventListener('click', () =>
    document.getElementById('poPortInput').focus()
  );

  // Input de porta
  const input = document.getElementById('poPortInput');
  input.addEventListener('keydown', e => {
    if (['Enter', ','].includes(e.key)) { e.preventDefault(); tryAddPort(state.ports, input.value.trim(), { onChange: _renderAllPorts }); }
    if (e.key === 'Backspace' && input.value === '' && state.ports.length > 0)
      removePort(state.ports, state.ports[state.ports.length - 1].num, { onChange: _renderAllPorts });
  });
  input.addEventListener('input', () => {
    const v = input.value;
    if (v.endsWith(',') || v.endsWith(' ')) tryAddPort(state.ports, v.replace(/[, ]/g,'').trim(), { onChange: _renderAllPorts });
  });

  // Segmented controls (radiogroup): clique + navegação por setas + aria-checked
  setupSegmented(document.getElementById('poSegProto'), btn => { state.proto = btn.dataset.v; });
  setupSegmented(document.getElementById('poSegDir'),   btn => { state.dir   = btn.dataset.v; });

  // Gerar
  document.getElementById('poBtnGenerate').addEventListener('click', _generate);

  // Output tabs (delegação) com aria-selected e tabindex
  const _activateOutputTab = (tab) => {
    container.querySelectorAll('.po-otab').forEach(t => {
      const active = t === tab;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
      t.setAttribute('tabindex', active ? '0' : '-1');
    });
    container.querySelectorAll('.po-pane').forEach(p => p.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById(`poPane-${tab.dataset.pane}`)?.classList.remove('hidden');
    tab.focus();
  };
  // Navegação por setas entre abas de output
  container.addEventListener('keydown', e => {
    if (!e.target.closest('#poTool-portopener .po-otab')) return;
    const list = [...container.querySelectorAll('#poTool-portopener .po-otab')];
    const idx = list.indexOf(e.target);
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = list[(idx + 1) % list.length];
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = list[(idx - 1 + list.length) % list.length];
    else if (e.key === 'Home') next = list[0];
    else if (e.key === 'End') next = list[list.length - 1];
    if (next) { e.preventDefault(); _activateOutputTab(next); }
  });

  container.addEventListener('click', e => {
    const tab = e.target.closest('#poTool-portopener .po-otab');
    if (tab) _activateOutputTab(tab);

    // Copiar
    const copyBtn = e.target.closest('.po-btn-copy');
    if (copyBtn) {
      const el = document.getElementById(copyBtn.dataset.id);
      navigator.clipboard.writeText(el._raw || el.textContent).then(() => {
        const prev = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado';
        copyBtn.classList.add('po-copied');
        setTimeout(() => { copyBtn.innerHTML = prev; copyBtn.classList.remove('po-copied'); }, 2000);
      });
    }

    // Download
    const dlBtn = e.target.closest('.po-btn-dl');
    if (dlBtn) {
      const el = document.getElementById(dlBtn.dataset.id);
      const text = el._raw || el.textContent;
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(new Blob([text], {type:'text/plain'})),
        download: dlBtn.dataset.name
      });
      a.click(); URL.revokeObjectURL(a.href);
    }
  });
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

  // Reset output tabs
  document.querySelectorAll('.po-otab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.po-pane').forEach(p => p.classList.add('hidden'));
  document.querySelector('.po-otab')?.classList.add('active');
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
