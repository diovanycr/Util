// ============================================================
//  escPos.js — Gerador de Comandos ESC/POS (Impressoras Térmicas)
// ============================================================

const PRINTERS = {
    epson:   { name: 'Epson',   notes: 'Comandos ESC/POS padrão. Modelo-base: TM-T20.' },
    bematech:{ name: 'Bematech',notes: 'Comandos ESC/POS (compatível). Modelo-base: MP-4200.' },
    elgin:   { name: 'Elgin',   notes: 'Comandos ESC/POS (compatível). Modelo-base: i9.' },
    daruma:  { name: 'Daruma',  notes: 'Comandos ESC/POS (compatível). Modelo-base: DR800.' },
};

const BAUD_RATES = [9600, 19200, 38400, 57600, 115200];

let escPrinter = 'epson';
let escBaud = 9600;
let escText = '';
let escCut = true;
let escDrawer = true;
let escFeed = 3;
let escAlign = 'center';
let escFont = 'a';
let escBold = false;
let escUnderline = false;

export function buildEscPosPanel() {
    return `
      <div id="poTool-escpos" class="po-tool-panel hidden">
        ${_buildHeader()}
        ${_buildConfig()}
        ${_buildTextInput()}
        ${_buildOptions()}
        ${_buildGenerateButton()}
        ${_buildOutputSection()}
      </div>
    `;
}

function _buildHeader() {
    return `
      <div class="card">
        <div class="po-card-header">
          <span class="po-card-icon">🖨️</span>
          <div>
            <h3 class="po-card-title">Gerador de Comandos ESC/POS</h3>
            <p class="sub">Gera comandos brutos para teste de impressoras térmicas (corte, gaveta, avanço)</p>
          </div>
        </div>
      </div>
    `;
}

function _buildConfig() {
    const printerBtns = Object.entries(PRINTERS).map(([key, p]) =>
        `<button class="po-seg-btn ${key === escPrinter ? 'active' : ''}" role="radio" aria-checked="${key === escPrinter}" tabindex="${key === escPrinter ? '0' : '-1'}" data-printer="${key}">${p.name}</button>`
    ).join('');

    const baudBtns = BAUD_RATES.map(b =>
        `<button class="po-seg-btn ${b === escBaud ? 'active' : ''}" role="radio" aria-checked="${b === escBaud}" tabindex="${b === escBaud ? '0' : '-1'}" data-baud="${b}">${b}</button>`
    ).join('');

    return `
      <div class="card">
        <p class="po-section-label">Configuração da impressora</p>
        <div class="po-opt-group">
          <p class="po-opt-label">Marca / Modelo</p>
          <div class="po-seg" id="escSegPrinter" role="radiogroup" aria-label="Marca da impressora">${printerBtns}</div>
          <p class="po-hint" id="escPrinterNotes">${PRINTERS[escPrinter].notes}</p>
        </div>
        <div class="po-opt-group mt-10">
          <p class="po-opt-label">Baud Rate (serial)</p>
          <div class="po-seg" id="escSegBaud" role="radiogroup" aria-label="Baud rate">${baudBtns}</div>
        </div>
      </div>
    `;
}

function _buildTextInput() {
    return `
      <div class="card">
        <p class="po-section-label">Texto de teste</p>
        <textarea id="escText" class="esc-textarea" rows="4" placeholder="Digite o texto para enviar à impressora...&#10;Ex: PainelAtende - Teste de impressão&#10;Linha 2&#10;Linha 3"></textarea>
      </div>
    `;
}

function _buildOptions() {
    return `
      <div class="card">
        <p class="po-section-label">Opções de comando</p>
        <div class="po-opts-grid">
          <div class="po-opt-group">
            <p class="po-opt-label">Alinhamento</p>
            <div class="po-seg" id="escSegAlign" role="radiogroup" aria-label="Alinhamento">
              <button class="po-seg-btn ${escAlign === 'left' ? 'active' : ''}" role="radio" aria-checked="${escAlign === 'left'}" tabindex="${escAlign === 'left' ? '0' : '-1'}" data-align="left">Esq.</button>
              <button class="po-seg-btn ${escAlign === 'center' ? 'active' : ''}" role="radio" aria-checked="${escAlign === 'center'}" tabindex="${escAlign === 'center' ? '0' : '-1'}" data-align="center">Centro</button>
              <button class="po-seg-btn ${escAlign === 'right' ? 'active' : ''}" role="radio" aria-checked="${escAlign === 'right'}" tabindex="${escAlign === 'right' ? '0' : '-1'}" data-align="right">Dir.</button>
            </div>
          </div>
          <div class="po-opt-group">
            <p class="po-opt-label">Fonte</p>
            <div class="po-seg" id="escSegFont" role="radiogroup" aria-label="Fonte">
              <button class="po-seg-btn ${escFont === 'a' ? 'active' : ''}" role="radio" aria-checked="${escFont === 'a'}" tabindex="${escFont === 'a' ? '0' : '-1'}" data-font="a">Font A</button>
              <button class="po-seg-btn ${escFont === 'b' ? 'active' : ''}" role="radio" aria-checked="${escFont === 'b'}" tabindex="${escFont === 'b' ? '0' : '-1'}" data-font="b">Font B</button>
            </div>
          </div>
        </div>
        <div class="esc-checks mt-10">
          <label class="esc-check"><input type="checkbox" id="escBold" ${escBold ? 'checked' : ''}/> <span>Negrito</span></label>
          <label class="esc-check"><input type="checkbox" id="escUnderline" ${escUnderline ? 'checked' : ''}/> <span>Sublinhado</span></label>
          <label class="esc-check"><input type="checkbox" id="escCut" ${escCut ? 'checked' : ''}/> <span>Cortar papel</span></label>
          <label class="esc-check"><input type="checkbox" id="escDrawer" ${escDrawer ? 'checked' : ''}/> <span>Abrir gaveta</span></label>
        </div>
        <div class="po-opt-group mt-10">
          <p class="po-opt-label">Avanço de papel (linhas): <strong id="escFeedVal">${escFeed}</strong></p>
          <input type="range" id="escFeed" min="0" max="10" value="${escFeed}" class="esc-range" />
        </div>
      </div>
    `;
}

function _buildGenerateButton() {
    return `
      <div class="card" style="padding:16px 24px;">
        <button id="escBtnGenerate" class="btn primary" style="width:100%;padding:13px;font-size:15px;justify-content:center;">
          <i class="fa-solid fa-terminal"></i> Gerar Comandos
        </button>
      </div>
    `;
}

function _buildOutputSection() {
    return `
      <div id="escOutput" class="hidden">
        <div class="po-notice">
          <span>⚠️</span>
          <span>Envie os comandos brutos via porta serial/USB da impressora. Execute como <strong>Administrador</strong> se usar scripts .bat/.ps1.</span>
        </div>
        <div class="po-summary">
          <span>✅</span>
          <span id="escSummaryText"></span>
        </div>
        <div class="tabs po-output-tabs" role="tablist" aria-label="Formatos de saída">
          <button class="tab active po-otab" role="tab" id="esc-tab-hex" aria-selected="true" aria-controls="escPane-hex" tabindex="0" data-pane="hex">HEX</button>
          <button class="tab po-otab" role="tab" id="esc-tab-bat" aria-selected="false" aria-controls="escPane-bat" tabindex="-1" data-pane="bat">.BAT</button>
          <button class="tab po-otab" role="tab" id="esc-tab-ps1" aria-selected="false" aria-controls="escPane-ps1" tabindex="-1" data-pane="ps1">PowerShell</button>
          <button class="tab po-otab" role="tab" id="esc-tab-python" aria-selected="false" aria-controls="escPane-python" tabindex="-1" data-pane="python">Python</button>
          <button class="tab po-otab" role="tab" id="esc-tab-raw" aria-selected="false" aria-controls="escPane-raw" tabindex="-1" data-pane="raw">Raw</button>
        </div>
        ${_buildCodePane('hex', 'Comandos em Hexadecimal', 'po-badge-blue', 'comandos-escpos.hex', true)}
        ${_buildCodePane('bat', 'Script Batch (CMD)', 'po-badge-gray', 'testar-impressora.bat', false)}
        ${_buildCodePane('ps1', 'Script PowerShell', 'po-badge-purple', 'testar-impressora.ps1', false)}
        ${_buildCodePane('python', 'Script Python', 'po-badge-blue', 'testar-impressora.py', false)}
        ${_buildCodePane('raw', 'Texto Raw com escapes', 'po-badge-amber', 'comandos-escpos.txt', false)}
      </div>
    `;
}

function _buildCodePane(key, title, badgeCls, dlName, hidden) {
    const badge = key === 'hex' ? 'HEX' : key === 'bat' ? '.bat' : key === 'ps1' ? '.ps1' : key === 'python' ? '.py' : '.txt';
    return `
      <div id="escPane-${key}" class="po-pane${hidden ? ' hidden' : ''}" role="tabpanel" aria-labelledby="esc-tab-${key}">
        <div class="card" style="padding:0;overflow:hidden;">
          <div class="po-code-header">
            <span class="po-code-title">${title} <span class="po-badge ${badgeCls}">${badge}</span></span>
            <div style="display:flex;gap:6px;">
              <button class="btn ghost po-btn-dl" data-id="escRaw-${key}" data-name="${dlName}"><i class="fa-solid fa-download"></i> Baixar</button>
              <button class="btn ghost po-btn-copy" data-id="escRaw-${key}"><i class="fa-solid fa-copy"></i> Copiar</button>
            </div>
          </div>
          <pre id="escRaw-${key}" class="po-pre"></pre>
        </div>
      </div>
    `;
}

// ── Bind de eventos (chamado depois do render) ─────────────────────────────
export function bindEscPosEvents(container) {
    const seg = (groupId, setter) => {
        const group = container.querySelector(groupId);
        if (!group) return;
        const radios = () => [...group.querySelectorAll('.po-seg-btn')];
        const select = (btn) => {
            radios().forEach(b => {
                const active = b === btn;
                b.classList.toggle('active', active);
                b.setAttribute('aria-checked', active ? 'true' : 'false');
                b.setAttribute('tabindex', active ? '0' : '-1');
            });
            setter(btn);
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
    };

    seg('#escSegPrinter', btn => {
        escPrinter = btn.dataset.printer;
        container.querySelector('#escPrinterNotes').textContent = PRINTERS[escPrinter].notes;
    });
    seg('#escSegBaud', btn => { escBaud = parseInt(btn.dataset.baud); });
    seg('#escSegAlign', btn => { escAlign = btn.dataset.align; });
    seg('#escSegFont', btn => { escFont = btn.dataset.font; });

    container.querySelector('#escBold')?.addEventListener('change', e => escBold = e.target.checked);
    container.querySelector('#escUnderline')?.addEventListener('change', e => escUnderline = e.target.checked);
    container.querySelector('#escCut')?.addEventListener('change', e => escCut = e.target.checked);
    container.querySelector('#escDrawer')?.addEventListener('change', e => escDrawer = e.target.checked);

    const feedRange = container.querySelector('#escFeed');
    if (feedRange) {
        feedRange.addEventListener('input', e => {
            escFeed = parseInt(e.target.value);
            container.querySelector('#escFeedVal').textContent = escFeed;
        });
    }

    container.querySelector('#escBtnGenerate')?.addEventListener('click', _generate);

    // Output tabs
    const _activateTab = (tab) => {
        container.querySelectorAll('[id^="esc-tab-"]').forEach(t => {
            const active = t === tab;
            t.classList.toggle('active', active);
            t.setAttribute('aria-selected', active ? 'true' : 'false');
            t.setAttribute('tabindex', active ? '0' : '-1');
        });
        container.querySelectorAll('[id^="escPane-"]').forEach(p => p.classList.add('hidden'));
        const pane = document.getElementById(`escPane-${tab.dataset.pane}`);
        if (pane) pane.classList.remove('hidden');
        tab.focus();
    };

    container.addEventListener('keydown', e => {
        if (!e.target.closest('[id^="esc-tab-"]')) return;
        const list = [...container.querySelectorAll('[id^="esc-tab-"]')];
        const idx = list.indexOf(e.target);
        let next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = list[(idx + 1) % list.length];
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = list[(idx - 1 + list.length) % list.length];
        else if (e.key === 'Home') next = list[0];
        else if (e.key === 'End') next = list[list.length - 1];
        if (next) { e.preventDefault(); _activateTab(next); }
    });

    container.addEventListener('click', e => {
        const tab = e.target.closest('[id^="esc-tab-"]');
        if (tab && tab.classList.contains('po-otab')) _activateTab(tab);
    });
}

// ── Geração dos comandos ───────────────────────────────────────────────────

function _strToHex(str) {
    return [...str].map(c => c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

function _buildCommands() {
    const cmds = [];
    const text = (document.getElementById('escText')?.value || '').trim() || 'PainelAtende - Teste de impressao';

    // Alinhamento
    const alignByte = escAlign === 'left' ? '00' : escAlign === 'right' ? '02' : '01';
    cmds.push({ name: 'Alinhamento', hex: `1B 61 ${alignByte}` });

    // Fonte
    const fontByte = escFont === 'b' ? '01' : '00';
    cmds.push({ name: 'Fonte', hex: `1B 4D ${fontByte}` });

    // Negrito
    cmds.push({ name: 'Negrito', hex: `1B 45 ${escBold ? '01' : '00'}` });

    // Sublinhado
    cmds.push({ name: 'Sublinhado', hex: `1B 2D ${escUnderline ? '01' : '00'}` });

    // Texto do usuário (cada linha)
    text.split('\n').forEach((line, i) => {
        const lineHex = _strToHex(line);
        cmds.push({ name: `Texto linha ${i + 1}`, hex: lineHex });
        cmds.push({ name: `Quebra linha ${i + 1}`, hex: '0A' });
    });

    // Avanço de papel
    if (escFeed > 0) {
        cmds.push({ name: 'Avanco de papel', hex: `1B 64 ${escFeed.toString(16).padStart(2, '0').toUpperCase()}` });
    }

    // Cortar papel
    if (escCut) {
        cmds.push({ name: 'Cortar papel', hex: '1D 56 00' });
    }

    // Abrir gaveta
    if (escDrawer) {
        cmds.push({ name: 'Abrir gaveta', hex: '1B 70 00 19 FA' });
    }

    return cmds;
}

function _generate() {
    const cmds = _buildCommands();
    const printerName = PRINTERS[escPrinter].name;

    // HEX
    const hexLines = [
        `:: Comandos ESC/POS - ${printerName}`,
        `:: Baud: ${escBaud} | Alinhamento: ${escAlign} | Fonte: ${escFont}`,
        `:: Negrito: ${escBold ? 'Sim' : 'Não'} | Sublinhado: ${escUnderline ? 'Sim' : 'Não'}`,
        `:: Corte: ${escCut ? 'Sim' : 'Não'} | Gaveta: ${escDrawer ? 'Sim' : 'Não'} | Avanco: ${escFeed} linhas`,
        '',
    ];
    cmds.forEach(c => hexLines.push(`:: ${c.name}`, c.hex, ''));
    _setCode('escRaw-hex', hexLines.join('\n'));

    // BAT
    const bat = [
        '@echo off',
        `:: Teste de impressora termica - ${printerName}`,
        `:: Envia comandos ESC/POS para a porta serial`,
        `:: Baud rate: ${escBaud}`,
        ':: Execute como Administrador',
        '',
        'net session >nul 2>&1',
        'if %errorLevel% neq 0 (',
        '    echo Erro: execute como Administrador.',
        '    pause & exit /b 1',
        ')',
        '',
        ':: Configura porta serial (ajuste COM1 se necessario)',
        `mode COM1 BAUD=${escBaud} PARITY=N DATA=8 STOP=1`,
        '',
        ':: Envia comandos ESC/POS',
    ];
    cmds.forEach(c => {
        bat.push(`:: ${c.name}`);
        const bytes = c.hex.split(' ');
        const hexStr = bytes.map(b => '0x' + b).join(',');
        bat.push(`echo|set /p="?${hexStr}">COM1`);
    });
    bat.push('', 'echo Comandos enviados!', 'pause');
    _setCode('escRaw-bat', bat.join('\n'));

    // PowerShell
    const ps = [
        `# Teste de impressora termica - ${printerName}`,
        `# Baud rate: ${escBaud}`,
        '# Execute como Administrador',
        '',
        '$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())',
        'if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {',
        '    Write-Error "Execute como Administrador!" ; exit 1',
        '}',
        '',
        '$port = New-Object System.IO.Ports.SerialPort "COM1", ' + escBaud + ', "None", 8, "One"',
        '$port.Open()',
        '',
        '# Envia comandos ESC/POS',
    ];
    cmds.forEach(c => {
        ps.push(`# ${c.name}`);
        const bytes = c.hex.split(' ');
        const byteArr = bytes.map(b => '0x' + b).join(',');
        ps.push(`$port.Write([byte[]](${byteArr}), 0, ${bytes.length})`);
    });
    ps.push('', '$port.Close()', 'Write-Host "Comandos enviados com sucesso!" -ForegroundColor Green');
    _setCode('escRaw-ps1', ps.join('\n'));

    // Python
    const py = [
        '# Teste de impressora termica - ' + printerName,
        '# Requer: pip install pyserial',
        '# Baud rate: ' + escBaud,
        '',
        'import serial',
        '',
        `ser = serial.Serial('COM1', ${escBaud}, timeout=1)`,
        '',
        '# Envia comandos ESC/POS',
    ];
    cmds.forEach(c => {
        py.push(`# ${c.name}`);
        const bytes = c.hex.split(' ');
        const byteArr = bytes.map(b => '0x' + b).join(',');
        py.push(`ser.write(bytes([${byteArr}]))`);
    });
    py.push('', 'ser.close()', 'print("Comandos enviados com sucesso!")');
    _setCode('escRaw-python', py.join('\n'));

    // Raw
    const raw = [
        `Comandos ESC/POS - ${printerName}`,
        `Baud: ${escBaud} | Alinhamento: ${escAlign} | Fonte: ${escFont}`,
        `Negrito: ${escBold ? 'Sim' : 'Nao'} | Sublinhado: ${escUnderline ? 'Sim' : 'Nao'}`,
        `Corte: ${escCut ? 'Sim' : 'Nao'} | Gaveta: ${escDrawer ? 'Sim' : 'Nao'} | Avanco: ${escFeed} linhas`,
        '',
    ];
    cmds.forEach(c => raw.push(`${c.name}: ${c.hex}`));
    _setCode('escRaw-raw', raw.join('\n'));

    // Summary
    const features = [];
    if (escBold) features.push('Negrito');
    if (escUnderline) features.push('Sublinhado');
    if (escCut) features.push('Corte');
    if (escDrawer) features.push('Gaveta');
    features.push(`Avanco: ${escFeed}`);
    document.getElementById('escSummaryText').textContent =
        `${printerName} · ${escBaud} baud · ${escAlign} · ${features.join(', ')}`;

    // Reset output tabs
    const container = document.getElementById('poTool-escpos');
    if (!container) return;
    container.querySelectorAll('[id^="esc-tab-"]').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
    });
    container.querySelectorAll('[id^="escPane-"]').forEach(p => p.classList.add('hidden'));
    const firstTab = document.getElementById('esc-tab-hex');
    if (firstTab) {
        firstTab.classList.add('active');
        firstTab.setAttribute('aria-selected', 'true');
        firstTab.setAttribute('tabindex', '0');
    }
    document.getElementById('escPane-hex')?.classList.remove('hidden');

    const out = document.getElementById('escOutput');
    out.classList.remove('hidden');
    setTimeout(() => out.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}

// ── Highlight e setCode (reutiliza o padrão do portOpener) ─────────────────
function _setCode(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el._raw = text;
    el.innerHTML = _hlEsc(text);
}

function _hlEsc(code) {
    const tokens = [];
    const stash = html => `\u0000${tokens.push(html) - 1}\u0000`;
    const e = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let src = e(code);

    // Comentários
    src = src.replace(/(^|\n)(:: ?.*|# .*|@echo off)/g, (m, p, c) => `${p}${stash(`<span class="po-c-cmt">${c}</span>`)}`);
    // Strings
    src = src.replace(/"([^"]*)"/g, m => stash(`<span class="po-c-str">${m}</span>`));
    // Variáveis PowerShell
    src = src.replace(/(\$[\w.[\]]+)/g, m => stash(`<span class="po-c-var">${m}</span>`));
    // Hex bytes (XX XX XX ...)
    src = src.replace(/\b([0-9A-Fa-f]{2}(?: [0-9A-Fa-f]{2})+)\b/g, m => stash(`<span class="po-c-num">${m}</span>`));
    // Números
    src = src.replace(/\b(\d+)\b/g, m => stash(`<span class="po-c-num">${m}</span>`));
    // Comandos
    src = src.replace(/\b(echo|set|mode|net|pause|exit|import|serial|ser|write|close|print|Write-Host|Write-Error|New-Object|if|else|for|function)\b/g,
        m => stash(`<span class="po-c-cmd">${m}</span>`));

    for (let i = tokens.length - 1; i >= 0; i--) {
        src = src.replace(`\u0000${i}\u0000`, tokens[i]);
    }
    return src;
}
