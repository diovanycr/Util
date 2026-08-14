// ============================================================
//  esc-pos/builders.js — Construtores do HTML do painel ESC/POS
// ============================================================

import { PRINTERS, BAUD_RATES } from './constants.js';
import { escapeHtml } from '../../core/utils.js';

export function buildHeader() {
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

export function buildConfig(state) {
    const printerBtns = Object.entries(PRINTERS).map(([key, p]) =>
        `<button class="po-seg-btn ${key === state.printer ? 'active' : ''}" role="radio" aria-checked="${key === state.printer}" tabindex="${key === state.printer ? '0' : '-1'}" data-printer="${key}">${escapeHtml(p.name)}</button>`
    ).join('');

    const baudBtns = BAUD_RATES.map(b =>
        `<button class="po-seg-btn ${b === state.baud ? 'active' : ''}" role="radio" aria-checked="${b === state.baud}" tabindex="${b === state.baud ? '0' : '-1'}" data-baud="${b}">${b}</button>`
    ).join('');

    return `
      <div class="card">
        <p class="po-section-label">Configuração da impressora</p>
        <div class="po-opt-group">
          <p class="po-opt-label">Marca / Modelo</p>
          <div class="po-seg" id="escSegPrinter" role="radiogroup" aria-label="Marca da impressora">${printerBtns}</div>
          <p class="po-hint" id="escPrinterNotes">${escapeHtml(PRINTERS[state.printer].notes)}</p>
        </div>
        <div class="po-opt-group mt-10">
          <p class="po-opt-label">Baud Rate (serial)</p>
          <div class="po-seg" id="escSegBaud" role="radiogroup" aria-label="Baud rate">${baudBtns}</div>
        </div>
      </div>
    `;
}

export function buildTextInput() {
    return `
      <div class="card">
        <p class="po-section-label">Texto de teste</p>
        <textarea id="escText" class="esc-textarea" rows="4" placeholder="Digite o texto para enviar à impressora...&#10;Ex: PainelAtende - Teste de impressão&#10;Linha 2&#10;Linha 3"></textarea>
      </div>
    `;
}

export function buildOptions(state) {
    return `
      <div class="card">
        <p class="po-section-label">Opções de comando</p>
        <div class="po-opts-grid">
          <div class="po-opt-group">
            <p class="po-opt-label">Alinhamento</p>
            <div class="po-seg" id="escSegAlign" role="radiogroup" aria-label="Alinhamento">
              <button class="po-seg-btn ${state.align === 'left' ? 'active' : ''}" role="radio" aria-checked="${state.align === 'left'}" tabindex="${state.align === 'left' ? '0' : '-1'}" data-align="left">Esq.</button>
              <button class="po-seg-btn ${state.align === 'center' ? 'active' : ''}" role="radio" aria-checked="${state.align === 'center'}" tabindex="${state.align === 'center' ? '0' : '-1'}" data-align="center">Centro</button>
              <button class="po-seg-btn ${state.align === 'right' ? 'active' : ''}" role="radio" aria-checked="${state.align === 'right'}" tabindex="${state.align === 'right' ? '0' : '-1'}" data-align="right">Dir.</button>
            </div>
          </div>
          <div class="po-opt-group">
            <p class="po-opt-label">Fonte</p>
            <div class="po-seg" id="escSegFont" role="radiogroup" aria-label="Fonte">
              <button class="po-seg-btn ${state.font === 'a' ? 'active' : ''}" role="radio" aria-checked="${state.font === 'a'}" tabindex="${state.font === 'a' ? '0' : '-1'}" data-font="a">Font A</button>
              <button class="po-seg-btn ${state.font === 'b' ? 'active' : ''}" role="radio" aria-checked="${state.font === 'b'}" tabindex="${state.font === 'b' ? '0' : '-1'}" data-font="b">Font B</button>
            </div>
          </div>
        </div>
        <div class="esc-checks mt-10">
          <label class="esc-check"><input type="checkbox" id="escBold" ${state.bold ? 'checked' : ''}/> <span>Negrito</span></label>
          <label class="esc-check"><input type="checkbox" id="escUnderline" ${state.underline ? 'checked' : ''}/> <span>Sublinhado</span></label>
          <label class="esc-check"><input type="checkbox" id="escCut" ${state.cut ? 'checked' : ''}/> <span>Cortar papel</span></label>
          <label class="esc-check"><input type="checkbox" id="escDrawer" ${state.drawer ? 'checked' : ''}/> <span>Abrir gaveta</span></label>
        </div>
        <div class="po-opt-group mt-10">
          <p class="po-opt-label">Avanço de papel (linhas): <strong id="escFeedVal">${state.feed}</strong></p>
          <input type="range" id="escFeed" min="0" max="10" value="${state.feed}" class="esc-range" />
        </div>
      </div>
    `;
}

export function buildGenerateButton() {
    return `
      <div class="card" style="padding:16px 24px;">
        <button id="escBtnGenerate" class="btn primary" style="width:100%;padding:13px;font-size:15px;justify-content:center;">
          <i class="fa-solid fa-terminal"></i> Gerar Comandos
        </button>
      </div>
    `;
}

export function buildCodePane(key, title, badgeCls, dlName, hidden) {
    const badge = key === 'hex' ? 'HEX' : key === 'bat' ? '.bat' : key === 'ps1' ? '.ps1' : key === 'python' ? '.py' : '.txt';
    return `
      <div id="escPane-${key}" class="po-pane${hidden ? ' hidden' : ''}" role="tabpanel" aria-labelledby="esc-tab-${key}">
        <div class="card" style="padding:0;overflow:hidden;">
          <div class="po-code-header">
            <span class="po-code-title">${escapeHtml(title)} <span class="po-badge ${badgeCls}">${badge}</span></span>
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

export function buildOutputSection() {
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
        ${buildCodePane('hex', 'Comandos em Hexadecimal', 'po-badge-blue', 'comandos-escpos.hex', true)}
        ${buildCodePane('bat', 'Script Batch (CMD)', 'po-badge-gray', 'testar-impressora.bat', false)}
        ${buildCodePane('ps1', 'Script PowerShell', 'po-badge-purple', 'testar-impressora.ps1', false)}
        ${buildCodePane('python', 'Script Python', 'po-badge-blue', 'testar-impressora.py', false)}
        ${buildCodePane('raw', 'Texto Raw com escapes', 'po-badge-amber', 'comandos-escpos.txt', false)}
      </div>
    `;
}

export function buildPanel(state) {
    return `
      <div id="poTool-escpos" class="po-tool-panel hidden">
        ${buildHeader()}
        ${buildConfig(state)}
        ${buildTextInput()}
        ${buildOptions(state)}
        ${buildGenerateButton()}
        ${buildOutputSection()}
      </div>
    `;
}
