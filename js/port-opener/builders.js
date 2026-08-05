// ============================================================
//  port-opener/builders.js — Construtores do HTML do painel Port Opener
// ============================================================

export function buildPortOpenerHeader() {
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

export function buildPortInput() {
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

export function buildQuickPorts() {
  return `
    <div class="card">
      <p class="po-section-label">Portas comuns</p>
      <div class="po-quick-grid" id="poQuickGrid"></div>
    </div>
  `;
}

export function buildOptions() {
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

export function buildGenerateButton() {
  return `
    <div class="card" style="padding:16px 24px;">
      <button id="poBtnGenerate" class="btn primary" style="width:100%;padding:13px;font-size:15px;justify-content:center;">
        <i class="fa-solid fa-terminal"></i> Gerar Scripts
      </button>
    </div>
  `;
}

export function buildOutputSection() {
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

      ${buildCodePane('bat',   'Script executável',    'po-badge-blue',   'abrir-portas.bat',   true)}
      ${buildCodePane('ps1',   'PowerShell Script',    'po-badge-purple', 'abrir-portas.ps1',   true)}
      ${buildCodePane('netsh', 'Comandos netsh (CMD)', 'po-badge-gray',   null,                 false)}
      ${buildCodePane('undo',  'Remover regras',       'po-badge-amber',  'remover-portas.bat', true)}

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
export function buildCodePane(key, title, badgeCls, dlName, hidden) {
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
export function buildFuturaPanel() {
  return `
    <div id="poTool-futura" class="po-tool-panel hidden">
      <div id="futuraSearchWidgetContainer"></div>
    </div>
  `;
}

/** Painel principal do Port Opener (entrada de portas, opções e output) */
export function buildPortOpenerPanel() {
  return `
    <div id="poTool-portopener" class="po-tool-panel hidden">
      ${buildPortOpenerHeader()}
      ${buildPortInput()}
      ${buildQuickPorts()}
      ${buildOptions()}
      ${buildGenerateButton()}
      ${buildOutputSection()}
    </div><!-- /poTool-portopener -->
  `;
}
