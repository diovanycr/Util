// ============================================================
//  portOpener.js — Port Opener integrado ao PainelAtende
// ============================================================

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

const COMMON_PORTS = {
  20:'FTP Data',21:'FTP',22:'SSH',23:'Telnet',25:'SMTP',53:'DNS',
  80:'HTTP',110:'POP3',143:'IMAP',443:'HTTPS',465:'SMTPS',587:'SMTP',
  993:'IMAPS',995:'POP3S',1433:'SQL Server',3000:'Node.js',3306:'MySQL',
  3389:'RDP',4200:'Angular',5000:'Flask',5173:'Vite',5432:'PostgreSQL',
  5601:'Kibana',5672:'RabbitMQ',6379:'Redis',6443:'Kubernetes',
  8000:'Django',8080:'HTTP Alt',8443:'HTTPS Alt',8888:'Jupyter',
  9000:'PHP-FPM',9090:'Prometheus',9200:'Elasticsearch',27017:'MongoDB'
};

const QUICK_PORTS = [
  {port:80,label:'HTTP'},{port:443,label:'HTTPS'},{port:3000,label:'Node.js'},
  {port:8080,label:'HTTP Alt'},{port:8000,label:'Django'},{port:5000,label:'Flask'},
  {port:5173,label:'Vite'},{port:4200,label:'Angular'},{port:3306,label:'MySQL'},
  {port:5432,label:'Postgres'},{port:6379,label:'Redis'},{port:27017,label:'MongoDB'},
  {port:22,label:'SSH'},{port:3389,label:'RDP'},
];

let poPorts = [];
let poProto = 'TCP';
let poDir   = 'IN';

// ── Render da aba Sistemas ────────────────────────────────────────────────
export function renderSistemasTab(container) {
  container.innerHTML = `
    <div class="po-wrap">
      ${_buildToolSelector()}
      ${_buildPortOpenerPanel()}
      ${buildEscPosPanel()}
      ${buildDocValidatorPanel()}
      ${buildStatusCheckerPanel()}
      ${buildApiTesterPanel()}
      ${buildFileValidatorPanel()}
      ${buildTicketSummaryPanel()}
      ${buildDecisionTreePanel()}
      ${buildNetworkDiagPanel()}
      ${buildScriptGenPanel()}
      ${_buildFuturaPanel()}
    </div><!-- /po-wrap -->
  `;

  _bindEvents(container);
  _renderQuickPorts();
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

  new FuturaSearchWidget({ containerId: 'futuraSearchWidgetContainer' });
}

// ── Sub-funções de construção do HTML ─────────────────────────────────────

/** Seletor de ferramenta (Port Opener | Futura Search) */
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

/** Painel principal do Port Opener (entrada de portas, opções e output) */
function _buildPortOpenerPanel() {
  return `
    <div id="poTool-portopener" class="po-tool-panel">
      ${_buildPortOpenerHeader()}
      ${_buildPortInput()}
      ${_buildQuickPorts()}
      ${_buildOptions()}
      ${_buildGenerateButton()}
      ${_buildOutputSection()}
    </div><!-- /poTool-portopener -->
  `;
}

/** Cabeçalho do card Port Opener */
function _buildPortOpenerHeader() {
  return `
    <div class="card">
      <div class="po-card-header">
        <span class="po-card-icon">🛡️</span>
        <div>
          <h3 class="po-card-title">Windows Port Opener</h3>
          <p class="sub">Gera scripts prontos para abrir portas no Firewall do Windows</p>
        </div>
      </div>
    </div>
  `;
}

/** Campo de entrada de portas com pills */
function _buildPortInput() {
  return `
    <div class="card">
      <p class="po-section-label">Portas</p>
      <div class="po-tag-field" id="poTagField">
        <div id="poTagPills" class="po-tag-pills"></div>
        <input id="poPortInput" class="po-port-input" type="text"
          inputmode="numeric" autocomplete="off"
          placeholder="Digite a porta e pressione Enter..." />
      </div>
      <p class="po-hint">
        <kbd>Enter</kbd> ou <kbd>,</kbd> para adicionar &nbsp;·&nbsp;
        <kbd>Backspace</kbd> para remover a última
      </p>
    </div>
  `;
}

/** Grid de portas comuns para seleção rápida */
function _buildQuickPorts() {
  return `
    <div class="card">
      <p class="po-section-label">Portas comuns</p>
      <div class="po-quick-grid" id="poQuickGrid"></div>
    </div>
  `;
}

/** Segmented controls de protocolo e direção */
function _buildOptions() {
  return `
    <div class="card">
      <p class="po-section-label">Opções</p>
      <div class="po-opts-grid">
        <div class="po-opt-group">
          <p class="po-opt-label" id="poProtoLabel">Protocolo</p>
          <div class="po-seg" id="poSegProto" role="radiogroup" aria-labelledby="poProtoLabel">
            <button class="po-seg-btn active" role="radio" aria-checked="true" tabindex="0" data-v="TCP">TCP</button>
            <button class="po-seg-btn" role="radio" aria-checked="false" tabindex="-1" data-v="UDP">UDP</button>
            <button class="po-seg-btn" role="radio" aria-checked="false" tabindex="-1" data-v="BOTH">Ambos</button>
          </div>
        </div>
        <div class="po-opt-group">
          <p class="po-opt-label" id="poDirLabel">Direção</p>
          <div class="po-seg" id="poSegDir" role="radiogroup" aria-labelledby="poDirLabel">
            <button class="po-seg-btn active" role="radio" aria-checked="true" tabindex="0" data-v="IN">Entrada</button>
            <button class="po-seg-btn" role="radio" aria-checked="false" tabindex="-1" data-v="OUT">Saída</button>
            <button class="po-seg-btn" role="radio" aria-checked="false" tabindex="-1" data-v="BOTH">Ambas</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/** Botão de geração de scripts */
function _buildGenerateButton() {
  return `
    <div class="card" style="padding:16px 24px;">
      <button id="poBtnGenerate" class="btn primary" style="width:100%;padding:13px;font-size:15px;justify-content:center;">
        <i class="fa-solid fa-terminal"></i> Gerar Scripts
      </button>
    </div>
  `;
}

/** Área de output: aviso, resumo, abas .bat / .ps1 / netsh / undo */
function _buildOutputSection() {
  return `
    <div id="poOutput" class="hidden">

      <div class="po-notice">
        <span>⚠️</span>
        <span>Execute os scripts como <strong>Administrador</strong> — clique com o botão direito → "Executar como administrador"</span>
      </div>

      <div class="po-summary" id="poSummary">
        <span>✅</span>
        <span id="poSummaryText"></span>
        <div id="poSummaryTags" class="po-summary-tags"></div>
      </div>

      <!-- Abas de output -->
      <div class="tabs po-output-tabs" role="tablist" aria-label="Formatos de script">
        <button class="tab active po-otab" role="tab" id="po-tab-bat" aria-selected="true" aria-controls="poPane-bat" tabindex="0" data-pane="bat">.BAT</button>
        <button class="tab po-otab" role="tab" id="po-tab-ps1" aria-selected="false" aria-controls="poPane-ps1" tabindex="-1" data-pane="ps1">PowerShell</button>
        <button class="tab po-otab" role="tab" id="po-tab-netsh" aria-selected="false" aria-controls="poPane-netsh" tabindex="-1" data-pane="netsh">netsh</button>
        <button class="tab po-otab" role="tab" id="po-tab-undo" aria-selected="false" aria-controls="poPane-undo" tabindex="-1" data-pane="undo">Remover</button>
      </div>

      ${_buildCodePane('bat',   'Script executável',    'po-badge-blue',   'abrir-portas.bat',   true)}
      ${_buildCodePane('ps1',   'PowerShell Script',    'po-badge-purple', 'abrir-portas.ps1',   true)}
      ${_buildCodePane('netsh', 'Comandos netsh (CMD)', 'po-badge-gray',   null,                 false)}
      ${_buildCodePane('undo',  'Remover regras',       'po-badge-amber',  'remover-portas.bat', true)}

    </div><!-- /poOutput -->
  `;
}

/**
 * Painel de código de um formato de script específico.
 * @param {string}  key       - Identificador do painel (bat, ps1, netsh, undo)
 * @param {string}  title     - Título legível do painel
 * @param {string}  badgeCls  - Classe CSS da badge de formato
 * @param {string|null} dlName - Nome do arquivo para download (null = sem botão)
 * @param {boolean} hidden    - Se o painel começa oculto
 */
function _buildCodePane(key, title, badgeCls, dlName, hidden) {
  const ext    = key === 'ps1' ? '.ps1' : key === 'netsh' ? 'cmd' : '.bat';
  const badge  = key === 'netsh' ? 'cmd' : `.${key === 'undo' ? 'bat' : key}`;
  const dlBtn  = dlName
    ? `<button class="btn ghost po-btn-dl" data-id="poRaw-${key}" data-name="${dlName}"><i class="fa-solid fa-download"></i> Baixar</button>`
    : '';

  return `
    <div id="poPane-${key}" class="po-pane${hidden ? ' hidden' : ''}" role="tabpanel" aria-labelledby="po-tab-${key}">
      <div class="card" style="padding:0;overflow:hidden;">
        <div class="po-code-header">
          <span class="po-code-title">${title} <span class="po-badge ${badgeCls}">${badge}</span></span>
          <div style="display:flex;gap:6px;">
            ${dlBtn}
            <button class="btn ghost po-btn-copy" data-id="poRaw-${key}"><i class="fa-solid fa-copy"></i> Copiar</button>
          </div>
        </div>
        <pre id="poRaw-${key}" class="po-pre"></pre>
      </div>
    </div>
  `;
}

/** Contêiner do Futura Search Widget */
function _buildFuturaPanel() {
  return `
    <div id="poTool-futura" class="po-tool-panel hidden">
      <div id="futuraSearchWidgetContainer"></div>
    </div>
  `;
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
    if (['Enter', ','].includes(e.key)) { e.preventDefault(); _tryAdd(input.value.trim()); }
    if (e.key === 'Backspace' && input.value === '' && poPorts.length > 0)
      _removePort(poPorts[poPorts.length - 1].num);
  });
  input.addEventListener('input', () => {
    const v = input.value;
    if (v.endsWith(',') || v.endsWith(' ')) _tryAdd(v.replace(/[, ]/g,'').trim());
  });

  // Segmented controls (radiogroup): clique + navegação por setas + aria-checked
  function _setupSegmented(groupId, setter) {
    const group = document.getElementById(groupId);
    if (!group) return;
    const radios = () => [...group.querySelectorAll('.po-seg-btn')];
    const select = (btn) => {
      radios().forEach(b => {
        const active = b === btn;
        b.classList.toggle('active', active);
        b.setAttribute('aria-checked', active ? 'true' : 'false');
        b.setAttribute('tabindex', active ? '0' : '-1');
      });
      setter(btn.dataset.v);
      btn.focus();
    };
    group.addEventListener('click', e => { const btn = e.target.closest('.po-seg-btn'); if (btn) select(btn); });
    group.addEventListener('keydown', e => {
      const list = radios();
      const idx = list.indexOf(document.activeElement);
      let next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = list[(idx + 1) % list.length];
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = list[(idx - 1 + list.length) % list.length];
      else if (e.key === 'Home') next = list[0];
      else if (e.key === 'End') next = list[list.length - 1];
      if (next) { e.preventDefault(); select(next); }
    });
  }
  _setupSegmented('poSegProto', v => poProto = v);
  _setupSegmented('poSegDir',   v => poDir   = v);

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

// ── Portas rápidas ────────────────────────────────────────────────────────
function _renderQuickPorts() {
  const grid = document.getElementById('poQuickGrid');
  if (!grid) return;
  grid.innerHTML = QUICK_PORTS.map(p => {
    const isActive = !!poPorts.find(x => x.num === p.port);
    return `
    <button class="po-quick-btn ${isActive ? 'active' : ''}" role="button" aria-pressed="${isActive}" data-port="${p.port}" data-label="${p.label}">
      <span class="po-q-num">${p.port}</span>
      <span class="po-q-label">${p.label}</span>
    </button>`;
  }).join('');

  grid.querySelectorAll('.po-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const num = parseInt(btn.dataset.port);
      if (poPorts.find(p=>p.num===num)) _removePort(num);
      else { poPorts.push({num, label: btn.dataset.label}); _renderTags(); _syncQuick(); }
    });
  });
}

function _syncQuick() {
  document.querySelectorAll('.po-quick-btn').forEach(btn => {
    const isActive = !!poPorts.find(p => p.num === parseInt(btn.dataset.port));
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

// ── Tags ──────────────────────────────────────────────────────────────────
function _tryAdd(raw) {
  if (!raw) return;
  const n = parseInt(raw);
  if (isNaN(n) || n < 1 || n > 65535) { _shakeField(); document.getElementById('poPortInput').value=''; return; }
  if (poPorts.find(p=>p.num===n)) { document.getElementById('poPortInput').value=''; return; }
  poPorts.push({num:n, label: COMMON_PORTS[n]||''});
  document.getElementById('poPortInput').value = '';
  _renderTags(); _syncQuick();
}

function _removePort(num) {
  poPorts = poPorts.filter(p=>p.num!==num);
  _renderTags(); _syncQuick();
}

function _renderTags() {
  const pills = document.getElementById('poTagPills');
  if (!pills) return;
  pills.innerHTML = poPorts.map(p => `
    <span class="po-tag-pill">
      ${p.num}${p.label ? ` <span class="po-tag-name">${p.label}</span>` : ''}
      <button class="po-tag-remove" data-num="${p.num}" aria-label="Remover porta ${p.num}${p.label ? ` (${p.label})` : ''}">×</button>
    </span>
  `).join('');
  pills.querySelectorAll('.po-tag-remove').forEach(btn =>
    btn.addEventListener('click', () => _removePort(parseInt(btn.dataset.num)))
  );
}

function _shakeField() {
  const f = document.getElementById('poTagField');
  f.classList.remove('po-shake'); void f.offsetWidth; f.classList.add('po-shake');
  setTimeout(() => f.classList.remove('po-shake'), 400);
}

// ── Geração dos scripts ───────────────────────────────────────────────────
function _ruleName(port, proto, dir) {
  const base = (COMMON_PORTS[port]||`Porta_${port}`).replace(/[\s/]/g,'_');
  return `${base}_${port}_${proto}_${dir==='IN'?'IN':'OUT'}`;
}

function _generate() {
  if (poPorts.length === 0) { _shakeField(); document.getElementById('poPortInput').focus(); return; }

  const protos = poProto==='BOTH'?['TCP','UDP']:[poProto];
  const dirs   = poDir  ==='BOTH'?['IN','OUT'] :[poDir];

  // BAT
  const bat = [
    `@echo off`,
    `:: Abre portas no Firewall do Windows`,
    `:: Portas: ${poPorts.map(p=>p.num).join(', ')}`,
    `:: Execute como Administrador`,``,
    `net session >nul 2>&1`,
    `if %errorLevel% neq 0 (`,
    `    echo Erro: execute como Administrador.`,
    `    pause & exit /b 1`,`)`,
    `echo Abrindo portas no Firewall...`,`echo.`,
  ];
  for (const p of poPorts) {
    bat.push(`echo [${p.num}] ${p.label||'porta '+p.num}`);
    for (const pr of protos) for (const dr of dirs) {
      bat.push(`netsh advfirewall firewall add rule name="${_ruleName(p.num,pr,dr)}" dir=${dr==='IN'?'in':'out'} action=allow protocol=${pr} localport=${p.num} enable=yes profile=any`);
    }
    bat.push('');
  }
  bat.push(`echo Concluido! ${poPorts.length} porta(s) configurada(s).`,`pause`);

  // PS1
  const ps = [
    `# Abre portas no Firewall do Windows`,
    `# Portas: ${poPorts.map(p=>p.num).join(', ')}`,
    `# Execute como Administrador`,``,
    `$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())`,
    `if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {`,
    `    Write-Error "Execute como Administrador!" ; exit 1`,`}`,``,
    `Write-Host "Abrindo portas..." -ForegroundColor Cyan`,``,
  ];
  for (const p of poPorts) {
    ps.push(`# ${p.num}${p.label?' — '+p.label:''}`);
    for (const pr of protos) for (const dr of dirs) {
      ps.push(`New-NetFirewallRule -DisplayName "${_ruleName(p.num,pr,dr)}" -Direction ${dr==='IN'?'Inbound':'Outbound'} -Action Allow -Protocol ${pr} -LocalPort ${p.num} -Enabled True -Profile Any`);
    }
    ps.push('');
  }
  ps.push(`Write-Host "Concluido! ${poPorts.length} porta(s) configurada(s)." -ForegroundColor Green`);

  // netsh
  const netsh = [`:: Cole no CMD como Administrador`,``];
  for (const p of poPorts) {
    netsh.push(`:: ${p.num}${p.label?' — '+p.label:''}`);
    for (const pr of protos) for (const dr of dirs)
      netsh.push(`netsh advfirewall firewall add rule name="${_ruleName(p.num,pr,dr)}" dir=${dr==='IN'?'in':'out'} action=allow protocol=${pr} localport=${p.num} enable=yes profile=any`);
    netsh.push('');
  }

  // undo
  const undo = [
    `@echo off`,`:: Remove regras criadas`,
    `:: Portas: ${poPorts.map(p=>p.num).join(', ')}`,``,
    `net session >nul 2>&1`,
    `if %errorLevel% neq 0 ( echo Execute como Administrador. & pause & exit /b 1 )`,``,
  ];
  for (const p of poPorts) for (const pr of protos) for (const dr of dirs)
    undo.push(`netsh advfirewall firewall delete rule name="${_ruleName(p.num,pr,dr)}"`);
  undo.push(``,`echo Regras removidas com sucesso.`,`pause`);

  _setCode('poRaw-bat',   bat.join('\n'));
  _setCode('poRaw-ps1',   ps.join('\n'));
  _setCode('poRaw-netsh', netsh.join('\n'));
  _setCode('poRaw-undo',  undo.join('\n'));

  const dirLabel = poDir==='IN'?'Entrada':poDir==='OUT'?'Saída':'Entrada + Saída';
  document.getElementById('poSummaryText').textContent =
    `${poPorts.length} porta${poPorts.length>1?'s':''} · ${poProto} · ${dirLabel}`;
  document.getElementById('poSummaryTags').innerHTML =
    poPorts.map(p=>`<span class="po-s-tag">${p.num}</span>`).join('');

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
const _HL_TOKEN_COUNT = 8;
function _hl(code) {
  const tokens = [];
  const stash = html => `\u0000${tokens.push(html) - 1}\u0000`;
  const e = s => s.replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>');
  let src = e(code);

  // 1) Comentários (linha iniciando com :: , # , @echo off)
  src = src.replace(/(^|\n)(:: ?.*|# .*|@echo off)/g, (m, p, c) => `${p}${stash(`<span class="po-c-cmt">${c}</span>`)}`);

  // 2) Strings "..."
  src = src.replace(/"([^"]*)"/g, (m) => stash(`<span class="po-c-str">${m}</span>`));

  // 3) Variáveis PowerShell ($var)
  src = src.replace(/(\$[\w.[\]]+)/g, (m) => stash(`<span class="po-c-var">${m}</span>`));

  // 4) Comandos (palavras-chave)
  src = src.replace(/\b(netsh|advfirewall|firewall|add|delete|rule|New-NetFirewallRule|Remove-NetFirewallRule|Write-Host|Write-Error|net|session|if|exit|pause|echo)\b/g,
    m => stash(`<span class="po-c-cmd">${m}</span>`));

  // 5) Argumentos/valores
  src = src.replace(/\b(action|allow|block|dir|in|out|protocol|localport|enable|yes|profile|any|TCP|UDP|Inbound|Outbound|True|False|Allow)\b/g,
    m => stash(`<span class="po-c-kw">${m}</span>`));

  // 6) Números (portas)
  src = src.replace(/\b(\d{1,5})\b/g, m => stash(`<span class="po-c-num">${m}</span>`));

  // Restaura tokens na ordem inversa de inserção (placeholders estáveis)
  for (let i = tokens.length - 1; i >= 0; i--) {
    src = src.replace(`\u0000${i}\u0000`, tokens[i]);
  }
  return src;
}

function _setCode(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el._raw = text;
  el.innerHTML = _hl(text);
}
