// ============================================================
//  terminalFutura.js — Ferramenta Terminal FUTURA
//  Gera .zip com .bat + .ps1 em um clique
// ============================================================

const PS1_URL      = './scripts/Terminal-Futura.ps1';
const PS1_FILENAME = 'Terminal-Futura.ps1';
const BAT_FILENAME = 'Terminal-Futura.bat';
const ZIP_FILENAME = 'Terminal-Futura.zip';

// JSZip via CDN
const JSZIP_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';

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
          <p class="sub">Gera um <strong>.zip</strong> com o <strong>.bat</strong> e o <strong>.ps1</strong> prontos para usar — extraia e execute o .bat como Administrador</p>
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
        <i class="fa-solid fa-file-zipper"></i> Gerar e Baixar .ZIP
      </button>
    </div>

    <!-- Output / preview do .bat -->
    <div id="ftOutput" class="hidden">
      <div class="po-notice">
        <span>📦</span>
        <span>Extraia o <strong>.zip</strong>, coloque os dois arquivos na mesma pasta e execute o <strong>Terminal-Futura.bat</strong> como <strong>Administrador</strong></span>
      </div>
      <div class="card" style="padding:0;overflow:hidden;margin-top:4px;">
        <div class="po-code-header">
          <span class="po-code-title">Conteúdo do <span class="po-badge po-badge-blue">.bat</span></span>
          <button class="btn ghost" id="ftBtnCopy"><i class="fa-solid fa-copy"></i> Copiar</button>
        </div>
        <pre id="ftRawBat" class="po-pre"></pre>
      </div>
    </div>
  `;

  container.appendChild(panel);
  _bindEvents();
}

// ── Eventos ───────────────────────────────────────────────────────────────
function _bindEvents() {
  document.getElementById('ftOpsGrid')?.querySelectorAll('.ft-op-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ft-op-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.querySelectorAll('input[name="ftPasta"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const isCustom = document.getElementById('ftPastaRadioCustom').checked;
      document.getElementById('ftPastaCustomBox').classList.toggle('hidden', !isCustom);
      if (isCustom) document.getElementById('ftPastaCustomInput').focus();
    });
  });

  document.getElementById('ftBtnGerar')?.addEventListener('click', _generate);

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
}

// ── Geração do .zip ───────────────────────────────────────────────────────
async function _generate() {
  const op = document.querySelector('.ft-op-btn.active')?.dataset.op || '1';
  const usePadrao = document.getElementById('ftPastaRadioPadrao').checked;
  const customNome = document.getElementById('ftPastaCustomInput')?.value.trim() || '';

  if (!usePadrao && !customNome) {
    const input = document.getElementById('ftPastaCustomInput');
    input.style.borderColor = 'var(--danger)';
    input.focus();
    setTimeout(() => { input.style.borderColor = ''; }, 1500);
    return;
  }

  const nomeSanitizado = customNome.replace(/[\\/:*?"<>|]/g, '_');
  const pastaArg = usePadrao ? 'C:\\FUTURA' : `C:\\${nomeSanitizado}`;
  const opLabel  = op === '1' ? 'Criar Novo Terminal'
                 : op === '2' ? 'Atualizar Terminal'
                 : 'Atualizacao Completa';

  const btn = document.getElementById('ftBtnGerar');
  const prev = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gerando...';
  btn.disabled = true;

  try {
    // Buscar .ps1 do repositório
    const res = await fetch(PS1_URL);
    if (!res.ok) throw new Error(`Erro ao buscar .ps1: HTTP ${res.status}`);
    const ps1Content = await res.text();

    // Gerar .bat
    const batContent = _buildBat(op, opLabel, pastaArg);

    // Mostrar preview
    const el = document.getElementById('ftRawBat');
    el._raw = batContent;
    el.innerHTML = _hlBat(batContent);
    document.getElementById('ftOutput').classList.remove('hidden');

    // Carregar JSZip e gerar .zip
    await _loadJSZip();
    const zip = new JSZip();
    zip.file(BAT_FILENAME, batContent);
    zip.file(PS1_FILENAME, ps1Content);

    const blob = await zip.generateAsync({ type: 'blob' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: ZIP_FILENAME
    });
    a.click();
    URL.revokeObjectURL(a.href);

    btn.innerHTML = '<i class="fa-solid fa-check"></i> Baixado!';
    setTimeout(() => {
      btn.innerHTML = prev;
      btn.disabled = false;
      document.getElementById('ftOutput').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 1500);

  } catch (err) {
    console.error(err);
    btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Erro — tente novamente';
    btn.style.background = 'var(--danger)';
    setTimeout(() => {
      btn.innerHTML = prev;
      btn.disabled = false;
      btn.style.background = '';
    }, 3000);
  }
}

function _loadJSZip() {
  if (window.JSZip) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = JSZIP_CDN;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Falha ao carregar JSZip'));
    document.head.appendChild(s);
  });
}

// ── Geração do conteúdo do .bat ───────────────────────────────────────────
function _buildBat(op, opLabel, pastaArg) {
  return [
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
}

// ── Highlight .bat ────────────────────────────────────────────────────────
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
