// ============================================================
//  docValidatorUI.js — UI do Validador/Calculador de Documentos
// ============================================================

import {
    validateCPF, generateCPF, formatCPF,
    validateCNPJ, generateCNPJ, formatCNPJ,
    validatePIS, generatePIS,
    calculateNFeDV, generateNFeChave, formatNFeChave,
    validateIE, IE_FORMATS
} from './docValidator.js';
import { escapeHtml, setupSegmented } from './utils.js';

export function buildDocValidatorPanel() {
    return `
      <div id="poTool-docvalidator" class="po-tool-panel hidden">
        <div class="card">
          <div class="po-card-header">
            <span class="po-card-icon">📋</span>
            <div>
              <h3 class="po-card-title">Validador de Documentos Fiscais</h3>
              <p class="sub">Valide e gere CPF, CNPJ, PIS, Inscrição Estadual e Chave de Acesso NFe/NFCe</p>
            </div>
          </div>
        </div>

        <div class="card">
          <p class="po-section-label">Tipo de documento</p>
          <div class="po-seg" id="dvSegType" role="radiogroup" aria-label="Tipo de documento">
            <button class="po-seg-btn active" role="radio" aria-checked="true" tabindex="0" data-dtype="cpf">CPF</button>
            <button class="po-seg-btn" role="radio" aria-checked="false" tabindex="-1" data-dtype="cnpj">CNPJ</button>
            <button class="po-seg-btn" role="radio" aria-checked="false" tabindex="-1" data-dtype="pis">PIS</button>
            <button class="po-seg-btn" role="radio" aria-checked="false" tabindex="-1" data-dtype="ie">Insc. Estadual</button>
            <button class="po-seg-btn" role="radio" aria-checked="false" tabindex="-1" data-dtype="nfe">Chave NFe</button>
          </div>
        </div>

        ${_buildInputSection('cpf')}
      </div>
    `;
}

function _buildInputSection(type) {
    const isIE = type === 'ie';
    const isNFe = type === 'nfe';
    const placeholder = type === 'cpf' ? '000.000.000-00' : type === 'cnpj' ? '00.000.000/0000-00' : type === 'pis' ? '000.00000.00-0' : type === 'ie' ? 'Ex: 123456789' : '0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 000 00';
    const label = type === 'cpf' ? 'CPF' : type === 'cnpj' ? 'CNPJ' : type === 'pis' ? 'PIS' : type === 'ie' ? 'Inscrição Estadual' : 'Chave de Acesso (44 dígitos)';

    const ufSelect = isIE ? `
        <div class="po-opt-group mt-10">
          <p class="po-opt-label">UF</p>
          <select id="dvIEUF" class="dv-select">
            <option value="">Selecione a UF...</option>
            ${Object.entries(IE_FORMATS).map(([uf, info]) => `<option value="${uf}">${uf} - ${info.name}</option>`).join('')}
          </select>
        </div>` : '';

    const nfeInfo = isNFe ? `
        <div class="po-opt-group mt-10">
          <button id="dvBtnGenerateNFe" class="btn ghost"><i class="fa-solid fa-wand-magic-sparkles"></i> Gerar chave de exemplo</button>
        </div>` : '';

    return `
      <div id="dvInputSection" class="card">
        <p class="po-section-label">${label}</p>
        <div class="dv-input-row">
          <input id="dvInput" type="text" class="dv-input" placeholder="${placeholder}" />
          <button id="dvBtnValidate" class="btn primary" style="white-space:nowrap;"><i class="fa-solid fa-check"></i> Validar</button>
          <button id="dvBtnGenerate" class="btn ghost" style="white-space:nowrap;"><i class="fa-solid fa-wand-magic-sparkles"></i> Gerar</button>
        </div>
        ${ufSelect}
        ${nfeInfo}
      </div>

      <div id="dvResult" class="card hidden">
        <div id="dvResultStatus" class="dv-result-status"></div>
        <pre id="dvResultDetails" class="dv-result-pre"></pre>
      </div>
    `;
}

export function bindDocValidatorEvents(container) {
    let currentType = 'cpf';

    setupSegmented(container.querySelector('#dvSegType'), btn => {
        currentType = btn.dataset.dtype;
        _rebuildInput(container, currentType);
    });

    container.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        if (btn.id === 'dvBtnValidate') _doValidate(container, currentType);
        else if (btn.id === 'dvBtnGenerate') _doGenerate(container, currentType);
        else if (btn.id === 'dvBtnGenerateNFe') {
            const chave = generateNFeChave();
            if (chave) {
                container.querySelector('#dvInput').value = chave;
                _doValidate(container, currentType);
            }
        }
    });
}

function _rebuildInput(container, type) {
    const section = container.querySelector('#dvInputSection');
    if (section) section.outerHTML = _buildInputSection(type);
    container.querySelector('#dvResult')?.classList.add('hidden');
}

function _doValidate(container, type) {
    const input = container.querySelector('#dvInput');
    const result = container.querySelector('#dvResult');
    const status = container.querySelector('#dvResultStatus');
    const details = container.querySelector('#dvResultDetails');
    if (!input || !result || !status || !details) return;

    const value = input.value.trim();
    if (!value) {
        status.className = 'dv-result-status dv-status-error';
        status.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Digite um valor para validar.`;
        result.classList.remove('hidden');
        details.textContent = '';
        return;
    }

    let valid = false;
    let info = '';

    switch (type) {
        case 'cpf': {
            valid = validateCPF(value);
            info = valid
                ? `CPF ${escapeHtml(formatCPF(value))} é <strong>VÁLIDO</strong>.`
                : `CPF informado é <strong>INVÁLIDO</strong>.`;
            break;
        }
        case 'cnpj': {
            valid = validateCNPJ(value);
            info = valid
                ? `CNPJ ${escapeHtml(formatCNPJ(value))} é <strong>VÁLIDO</strong>.`
                : `CNPJ informado é <strong>INVÁLIDO</strong>.`;
            break;
        }
        case 'pis': {
            valid = validatePIS(value);
            info = valid
                ? `PIS informado é <strong>VÁLIDO</strong>.`
                : `PIS informado é <strong>INVÁLIDO</strong>.`;
            break;
        }
        case 'ie': {
            const uf = container.querySelector('#dvIEUF')?.value || '';
            const ieResult = validateIE(value, uf);
            valid = ieResult.valid;
            info = valid
                ? `Inscrição Estadual é <strong>VÁLIDA</strong>. ${escapeHtml(ieResult.message)}`
                : `<strong>INVÁLIDA</strong>. ${escapeHtml(ieResult.message)}`;
            break;
        }
        case 'nfe': {
            const digits = value.replace(/\D/g, '');
            if (digits.length < 44) {
                info = `Chave deve ter 44 dígitos (atual: ${escapeHtml(String(digits.length))}).`;
            } else {
                const dv = calculateNFeDV(digits.substring(0, 43));
                const providedDV = parseInt(digits[43]);
                if (dv === null) {
                    info = 'Não foi possível calcular o DV. Verifique a chave.';
                } else if (dv === providedDV) {
                    valid = true;
                    info = `Chave NFe <strong>VÁLIDA</strong> (DV ${dv} confere).`;
                } else {
                    info = `Chave <strong>INVÁLIDA</strong>. DV calculado: ${escapeHtml(String(dv))}, DV informado: ${escapeHtml(String(providedDV))}.`;
                }
            }
            break;
        }
    }

    status.className = `dv-result-status ${valid ? 'dv-status-valid' : 'dv-status-error'}`;
    status.innerHTML = valid
        ? `<i class="fa-solid fa-circle-check"></i> ${info}`
        : `<i class="fa-solid fa-circle-exclamation"></i> ${info}`;
    result.classList.remove('hidden');
    details.textContent = valid ? '' : 'Verifique o valor digitado e tente novamente.';
}

function _doGenerate(container, type) {
    const input = container.querySelector('#dvInput');
    if (!input) return;

    let value = '';
    switch (type) {
        case 'cpf': value = generateCPF(); break;
        case 'cnpj': value = generateCNPJ(); break;
        case 'pis': value = generatePIS(); break;
        case 'nfe': {
            const chave = generateNFeChave();
            value = chave || '';
            break;
        }
        default: return;
    }

    if (value) {
        input.value = value;
        _doValidate(container, type);
    }
}