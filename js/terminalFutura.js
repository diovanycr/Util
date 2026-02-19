// ============================================================
//  terminalFutura.js — Ferramenta Terminal FUTURA
//  Gera script .bat para gerenciamento de terminais FUTURA
//  Compatible com Windows 7/8/10/11
// ============================================================

// ── HTML do painel ────────────────────────────────────────────────────────
export function renderTerminalFutura(container) {
  const panel = document.createElement('div');
  panel.id = 'poTool-futura';
  panel.className = 'po-tool-panel hidden';
  panel.innerHTML = `

    <div class="card">
      <div class="po-card-header">
        <span class="po-card-icon">💻</span>
        <div>
          <h3 class="po-card-title">Gerenciamento de Terminais FUTURA</h3>
          <p class="sub">Gera o script <strong>.bat</strong> para executar no CMD — compatível com Windows 7/8/10/11</p>
        </div>
      </div>
    </div>

    <!-- Seleção de operação -->
    <div class="card">
      <p class="po-section-label">Operação</p>
      <div class="ft-ops-grid" id="ftOpsGrid">
        <button class="ft-op-btn active" data-op="1">
          <span class="ft-op-icon">🖥️</span>
          <span class="ft-op-title">Criar Novo Terminal</span>
          <span class="ft-op-desc">Configura servidor, copia arquivos e instala DLLs</span>
        </button>
        <button class="ft-op-btn" data-op="2">
          <span class="ft-op-icon">🔄</span>
          <span class="ft-op-title">Atualizar Terminal</span>
          <span class="ft-op-desc">Atualiza executáveis e DLLs de instalação existente</span>
        </button>
        <button class="ft-op-btn" data-op="3">
          <span class="ft-op-icon">⚙️</span>
          <span class="ft-op-title">Atualização Completa</span>
          <span class="ft-op-desc">Prepara banco de dados e executa o atualizador oficial</span>
        </button>
      </div>
    </div>

    <!-- Pasta de instalação -->
    <div class="card">
      <p class="po-section-label">Pasta de Instalação</p>
      <div class="ft-pasta-opts">
        <label class="ft-radio">
          <input type="radio" name="ftPasta" value="padrao" checked id="ftPastaRadioPadrao" />
          <span class="ft-radio-label">Usar padrão <strong>C:\\FUTURA</strong></span>
        </label>
        <label class="ft-radio">
          <input type="radio" name="ftPasta" value="custom" id="ftPastaRadioCustom" />
          <span class="ft-radio-label">Informar nome da pasta</span>
        </label>
      </div>
      <div id="ftPastaCustomBox" class="ft-custom-pasta hidden">
        <p class="po-hint" style="margin-bottom:6px;">A pasta será criada em <strong>C:\\</strong></p>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:13px;color:var(--muted);white-space:nowrap;font-weight:600;">C:\\</span>
          <input id="ftPastaCustomInput" type="text" placeholder="ex: FUTURA_FILIAL" class="ft-input" />
        </div>
      </div>
    </div>

    <!-- Botão gerar -->
    <div class="card" style="padding:16px 24px;">
      <button id="ftBtnGerar" class="btn primary" style="width:100%;padding:13px;font-size:15px;justify-content:center;">
        <i class="fa-solid fa-terminal"></i> Gerar Script .BAT
      </button>
    </div>

    <!-- Output -->
    <div id="ftOutput" class="hidden">

      <div class="po-notice">
        <span>⚠️</span>
        <span>Coloque o <strong>.bat gerado</strong> e o <strong>Terminal-Futura.ps1</strong> (script original) na mesma pasta e execute o <strong>.bat</strong> como <strong>Administrador</strong></span>
      </div>

      <div class="card" style="padding:0;overflow:hidden;">
        <div class="po-code-header">
          <span class="po-code-title">Script executável <span class="po-badge po-badge-blue">.bat</span></span>
          <div style="display:flex;gap:6px;">
            <button class="btn ghost" id="ftBtnDl"><i class="fa-solid fa-download"></i> Baixar</button>
            <button class="btn ghost" id="ftBtnCopy"><i class="fa-solid fa-copy"></i> Copiar</button>
          </div>
        </div>
        <pre id="ftRawBat" class="po-pre"></pre>
      </div>

      <div class="po-notice" style="background:var(--bg);border-color:var(--border);margin-top:12px;">
        <span>📁</span>
        <span>O arquivo <strong>Terminal-Futura.ps1</strong> deve estar na <strong>mesma pasta</strong> que o <strong>.bat</strong> gerado acima</span>
      </div>

    </div>
  `;

  container.appendChild(panel);
  _bindEvents();
}

// ── Eventos ───────────────────────────────────────────────────────────────
function _bindEvents() {
  // Seleção de operação
  document.getElementById('ftOpsGrid')?.querySelectorAll('.ft-op-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ft-op-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Toggle pasta custom
  document.querySelectorAll('input[name="ftPasta"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const box = document.getElementById('ftPastaCustomBox');
      const isCustom = document.getElementById('ftPastaRadioCustom').checked;
      box.classList.toggle('hidden', !isCustom);
      if (isCustom) document.getElementById('ftPastaCustomInput').focus();
    });
  });

  // Gerar
  document.getElementById('ftBtnGerar')?.addEventListener('click', _generate);

  // Copiar
  document.getElementById('ftBtnCopy')?.addEventListener('click', () => {
    const el = document.getElementById('ftRawBat');
    navigator.clipboard.writeText(el._raw || el.textContent).then(() => {
      const btn = document.getElementById('ftBtnCopy');
      const prev = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado';
      btn.classList.add('po-copied');
      setTimeout(() => { btn.innerHTML = prev; btn.classList.remove('po-copied'); }, 2000);
    });
  });

  // Download
  document.getElementById('ftBtnDl')?.addEventListener('click', () => {
    const el = document.getElementById('ftRawBat');
    const text = el._raw || el.textContent;
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([text], { type: 'text/plain' })),
      download: 'Terminal-Futura.bat'
    });
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

// ── Geração do .bat ───────────────────────────────────────────────────────
function _generate() {
  const op = document.querySelector('.ft-op-btn.active')?.dataset.op || '1';
  const usePadrao = document.getElementById('ftPastaRadioPadrao').checked;
  const customNome = document.getElementById('ftPastaCustomInput')?.value.trim() || '';

  // Validar pasta custom
  if (!usePadrao && !customNome) {
    const input = document.getElementById('ftPastaCustomInput');
    input.style.borderColor = 'var(--danger)';
    input.focus();
    setTimeout(() => { input.style.borderColor = ''; }, 1500);
    return;
  }

  // Sanitizar nome da pasta (mesmo critério do .ps1 original)
  const nomeSanitizado = customNome.replace(/[\\/:*?"<>|]/g, '_');
  const pastaArg = usePadrao ? 'C:\\FUTURA' : `C:\\${nomeSanitizado}`;
  const opLabel = op === '1' ? 'Criar Novo Terminal'
                : op === '2' ? 'Atualizar Terminal'
                : 'Atualizacao Completa';

  const bat = [
    `@echo off`,
    `REM ============================================================================`,
    `REM Terminal FUTURA - Gerenciamento v2.6.0`,
    `REM Operacao: [${op}] ${opLabel}`,
    `REM Pasta: ${pastaArg}`,
    `REM Gerado pelo PainelAtende`,
    `REM ============================================================================`,
    `title Terminal FUTURA - ${opLabel}`,
    `color 0B`,
    ``,
    `REM Verificar se esta executando como administrador`,
    `net session >nul 2>&1`,
    `if %errorLevel% == 0 goto :ExecutarScript`,
    ``,
    `cls`,
    `echo.`,
    `echo ============================================================`,
    `echo   PERMISSOES DE ADMINISTRADOR`,
    `echo ============================================================`,
    `echo.`,
    `echo Este script pode ser executado de duas formas:`,
    `echo.`,
    `echo [1] COMO ADMINISTRADOR (Recomendado)`,
    `echo     - Permite parar/reiniciar servicos do Firebird`,
    `echo     - Necessario para Atualizacao Completa (Opcao 3)`,
    `echo     - Evita erros ao manipular banco de dados`,
    `echo.`,
    `echo [2] COMO USUARIO NORMAL`,
    `echo     - Funciona para Criar Terminal (Opcao 1)`,
    `echo     - Funciona para Atualizar Terminal (Opcao 2)`,
    `echo     - NAO recomendado para Atualizacao Completa (Opcao 3)`,
    `echo.`,
    `echo ============================================================`,
    `echo.`,
    `set /p ELEVAR="Executar como Administrador? (S/N): "`,
    ``,
    `if /i "%ELEVAR%"=="S" (`,
    `    echo.`,
    `    echo Reiniciando como Administrador...`,
    `    echo.`,
    `    powershell -Command "Start-Process '%~f0' -Verb RunAs"`,
    `    if %errorLevel% == 0 exit`,
    `    echo.`,
    `    echo [!] Falha ao elevar privilegios`,
    `    echo Continuando como usuario normal...`,
    `    echo.`,
    `    timeout /t 3 >nul`,
    `) else (`,
    `    echo.`,
    `    echo Continuando como usuario normal...`,
    `    echo (Algumas operacoes podem falhar se exigirem admin)`,
    `    echo.`,
    `    timeout /t 2 >nul`,
    `)`,
    ``,
    `:ExecutarScript`,
    `cls`,
    ``,
    `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Terminal-Futura.ps1" -PastaFutura "${pastaArg}"`,
    ``,
    `set EXITCODE=%errorLevel%`,
    `if %EXITCODE% == 0 exit /b 0`,
    ``,
    `echo.`,
    `echo ============================================================`,
    `echo   ERRO AO EXECUTAR O SCRIPT`,
    `echo ============================================================`,
    `echo.`,
    `echo Codigo de erro: %EXITCODE%`,
    `echo.`,
    `echo Verifique o arquivo de log para mais detalhes.`,
    `echo.`,
    `pause`,
    `exit /b %EXITCODE%`,
  ].join('\r\n');

  const el = document.getElementById('ftRawBat');
  el._raw = bat;
  el.innerHTML = _hlBat(bat);

  const out = document.getElementById('ftOutput');
  out.classList.remove('hidden');
  setTimeout(() => out.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}

// ── Highlight sintaxe .bat ────────────────────────────────────────────────
function _hlBat(code) {
  const e = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return e(code)
    .replace(/(REM [^\n]*)/g, '<span class="po-c-cmt">$1</span>')
    .replace(/::[^\n]*/g, '<span class="po-c-cmt">$&</span>')
    .replace(/\b(echo|set|if|goto|exit|pause|cls|timeout|color|title|net|powershell\.exe|powershell|call)\b/gi,
      '<span class="po-c-cmd">$1</span>')
    .replace(/"([^"]*)"/g, '<span class="po-c-str">"$1"</span>')
    .replace(/%[\w]+%/g, '<span class="po-c-var">$&</span>')
    .replace(/:[A-Z][A-Za-z]+/g, '<span class="po-c-kw">$&</span>');
}
