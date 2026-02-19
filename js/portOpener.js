// ============================================================
//  portOpener.js — Port Opener integrado ao PainelAtende
// ============================================================

import { renderTerminalFutura } from './terminalFutura.js';

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

      <!-- Seletor de ferramenta -->
      <div class="card po-tool-selector">
        <p class="po-selector-label">Escolha uma ferramenta</p>
        <div class="po-tools-grid">
          <button class="po-tool-btn active" data-tool="portopener">
            <span class="po-tool-icon">🛡️</span>
            <span class="po-tool-name">Port Opener</span>
            <span class="po-tool-desc">Gera scripts para abrir portas no Firewall do Windows</span>
          </button>
          <button class="po-tool-btn" data-tool="futura">
            <span class="po-tool-icon">💻</span>
            <span class="po-tool-name">Terminal FUTURA</span>
            <span class="po-tool-desc">Gera scripts para criar, atualizar e manutenção de terminais</span>
          </button>
        </div>
      </div>

      <!-- Port Opener -->
      <div id="poTool-portopener" class="po-tool-panel">

        <div class="card">
          <div class="po-card-header">
            <span class="po-card-icon">🛡️</span>
            <div>
              <h3 class="po-card-title">Windows Port Opener</h3>
              <p class="sub">Gera scripts prontos para abrir portas no Firewall do Windows</p>
            </div>
          </div>
        </div>

        <!-- Entrada de portas -->
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

        <!-- Portas rápidas -->
        <div class="card">
          <p class="po-section-label">Portas comuns</p>
          <div class="po-quick-grid" id="poQuickGrid"></div>
        </div>

        <!-- Opções -->
        <div class="card">
          <p class="po-section-label">Opções</p>
          <div class="po-opts-grid">
            <div class="po-opt-group">
              <p class="po-opt-label">Protocolo</p>
              <div class="po-seg" id="poSegProto">
                <button class="po-seg-btn active" data-v="TCP">TCP</button>
                <button class="po-seg-btn" data-v="UDP">UDP</button>
                <button class="po-seg-btn" data-v="BOTH">Ambos</button>
              </div>
            </div>
            <div class="po-opt-group">
              <p class="po-opt-label">Direção</p>
              <div class="po-seg" id="poSegDir">
                <button class="po-seg-btn active" data-v="IN">Entrada</button>
                <button class="po-seg-btn" data-v="OUT">Saída</button>
                <button class="po-seg-btn" data-v="BOTH">Ambas</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Botão gerar -->
        <div class="card" style="padding:16px 24px;">
          <button id="poBtnGenerate" class="btn primary" style="width:100%;padding:13px;font-size:15px;justify-content:center;">
            <i class="fa-solid fa-terminal"></i> Gerar Scripts
          </button>
        </div>

        <!-- Output -->
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

          <!-- Tabs de output -->
          <div class="tabs po-output-tabs">
            <button class="tab active po-otab" data-pane="bat">.BAT</button>
            <button class="tab po-otab" data-pane="ps1">PowerShell</button>
            <button class="tab po-otab" data-pane="netsh">netsh</button>
            <button class="tab po-otab" data-pane="undo">Remover</button>
          </div>

          <div id="poPane-bat"   class="po-pane">
            <div class="card" style="padding:0;overflow:hidden;">
              <div class="po-code-header">
                <span class="po-code-title">Script executável <span class="po-badge po-badge-blue">.bat</span></span>
                <div style="display:flex;gap:6px;">
                  <button class="btn ghost po-btn-dl" data-id="poRaw-bat" data-name="abrir-portas.bat"><i class="fa-solid fa-download"></i> Baixar</button>
                  <button class="btn ghost po-btn-copy" data-id="poRaw-bat"><i class="fa-solid fa-copy"></i> Copiar</button>
                </div>
              </div>
              <pre id="poRaw-bat" class="po-pre"></pre>
            </div>
          </div>

          <div id="poPane-ps1"   class="po-pane hidden">
            <div class="card" style="padding:0;overflow:hidden;">
              <div class="po-code-header">
                <span class="po-code-title">PowerShell Script <span class="po-badge po-badge-purple">.ps1</span></span>
                <div style="display:flex;gap:6px;">
                  <button class="btn ghost po-btn-dl" data-id="poRaw-ps1" data-name="abrir-portas.ps1"><i class="fa-solid fa-download"></i> Baixar</button>
                  <button class="btn ghost po-btn-copy" data-id="poRaw-ps1"><i class="fa-solid fa-copy"></i> Copiar</button>
                </div>
              </div>
              <pre id="poRaw-ps1" class="po-pre"></pre>
            </div>
          </div>

          <div id="poPane-netsh" class="po-pane hidden">
            <div class="card" style="padding:0;overflow:hidden;">
              <div class="po-code-header">
                <span class="po-code-title">Comandos netsh (CMD) <span class="po-badge po-badge-gray">cmd</span></span>
                <div style="display:flex;gap:6px;">
                  <button class="btn ghost po-btn-copy" data-id="poRaw-netsh"><i class="fa-solid fa-copy"></i> Copiar</button>
                </div>
              </div>
              <pre id="poRaw-netsh" class="po-pre"></pre>
            </div>
          </div>

          <div id="poPane-undo"  class="po-pane hidden">
            <div class="card" style="padding:0;overflow:hidden;">
              <div class="po-code-header">
                <span class="po-code-title">Remover regras <span class="po-badge po-badge-amber">.bat</span></span>
                <div style="display:flex;gap:6px;">
                  <button class="btn ghost po-btn-dl" data-id="poRaw-undo" data-name="remover-portas.bat"><i class="fa-solid fa-download"></i> Baixar</button>
                  <button class="btn ghost po-btn-copy" data-id="poRaw-undo"><i class="fa-solid fa-copy"></i> Copiar</button>
                </div>
              </div>
              <pre id="poRaw-undo" class="po-pre"></pre>
            </div>
          </div>

        </div><!-- /poOutput -->
      </div><!-- /poTool-portopener -->


    </div><!-- /po-wrap -->
  `;

  _bindEvents(container);
  _renderQuickPorts();
  renderTerminalFutura(document.querySelector('.po-wrap'));
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

  // Segmented controls
  document.getElementById('poSegProto').addEventListener('click', e => {
    const btn = e.target.closest('.po-seg-btn'); if (!btn) return;
    document.getElementById('poSegProto').querySelectorAll('.po-seg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    poProto = btn.dataset.v;
  });
  document.getElementById('poSegDir').addEventListener('click', e => {
    const btn = e.target.closest('.po-seg-btn'); if (!btn) return;
    document.getElementById('poSegDir').querySelectorAll('.po-seg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    poDir = btn.dataset.v;
  });

  // Gerar
  document.getElementById('poBtnGenerate').addEventListener('click', _generate);

  // Output tabs (delegação)
  container.addEventListener('click', e => {
    const tab = e.target.closest('.po-otab');
    if (tab) {
      container.querySelectorAll('.po-otab').forEach(t => t.classList.remove('active'));
      container.querySelectorAll('.po-pane').forEach(p => p.classList.add('hidden'));
      tab.classList.add('active');
      document.getElementById(`poPane-${tab.dataset.pane}`)?.classList.remove('hidden');
    }

    // Copiar
    const copyBtn = e.target.closest('.po-btn-copy');
    if (copyBtn) {
      const el = document.getElementById(copyBtn.dataset.id);
      navigator.clipboard.writeText(el._raw || el.textContent).then(() => {
        const icon = copyBtn.querySelector('i');
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
  grid.innerHTML = QUICK_PORTS.map(p => `
    <button class="po-quick-btn ${poPorts.find(x=>x.num===p.port)?'active':''}" data-port="${p.port}" data-label="${p.label}">
      <span class="po-q-num">${p.port}</span>
      <span class="po-q-label">${p.label}</span>
    </button>
  `).join('');

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
    btn.classList.toggle('active', !!poPorts.find(p=>p.num===parseInt(btn.dataset.port)));
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
      <button class="po-tag-remove" data-num="${p.num}">×</button>
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
function _hl(code) {
  const e = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return e(code)
    .replace(/((?:^|\n)(:: ?.*|# .*|@echo off))/g, m=>`<span class="po-c-cmt">${m}</span>`)
    .replace(/\b(netsh|advfirewall|firewall|add|delete|rule|New-NetFirewallRule|Remove-NetFirewallRule|Write-Host|Write-Error|net|session|if|exit|pause|echo)\b/g,
      '<span class="po-c-cmd">$1</span>')
    .replace(/\b(action|allow|block|dir|in|out|protocol|localport|enable|yes|profile|any|TCP|UDP|Inbound|Outbound|True|False|Allow)\b/g,
      '<span class="po-c-kw">$1</span>')
    .replace(/"([^"]*)"/g,'<span class="po-c-str">"$1"</span>')
    .replace(/\b(\d{2,5})\b/g,'<span class="po-c-num">$1</span>')
    .replace(/(\$[\w.[\]]+)/g,'<span class="po-c-var">$1</span>');
}

function _setCode(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el._raw = text;
  el.innerHTML = _hl(text);
}
