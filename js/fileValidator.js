// ============================================================
//  fileValidator.js — Validador de Arquivos Fiscais / Ponto
// ============================================================
//  Validador rápido de XML de NFe/NFCe, parser de arquivos AFD/AFDT
//  de relógio de ponto e extrator de CNPJ/Inscrição Estadual

import { setupSegmented, setStatusBadge } from './utils.js';

export function buildFileValidatorPanel() {
    return `
      <div id="poTool-filevalidator" class="po-tool-panel hidden">
        <div class="card">
          <div class="po-card-header">
            <span class="po-card-icon">📂</span>
            <div>
              <h3 class="po-card-title">Validador de Arquivos Fiscais & Ponto</h3>
              <p class="sub">Valide XML de NFe/NFCe, faça parse de arquivos AFD/AFDT de relógio de ponto e extraia CNPJ/IE</p>
            </div>
          </div>
        </div>

        <div class="card">
          <p class="po-section-label">Tipo de arquivo</p>
          <div class="po-seg" id="fvSegType" role="radiogroup" aria-label="Tipo de arquivo">
            <button class="po-seg-btn active" role="radio" aria-checked="true" tabindex="0" data-ftype="xml">XML NFe/NFCe</button>
            <button class="po-seg-btn" role="radio" aria-checked="false" tabindex="-1" data-ftype="afd">AFD (Ponto)</button>
            <button class="po-seg-btn" role="radio" aria-checked="false" tabindex="-1" data-ftype="afdt">AFDT (Ponto)</button>
            <button class="po-seg-btn" role="radio" aria-checked="false" tabindex="-1" data-ftype="cnpj">Extrair CNPJ/IE</button>
          </div>
        </div>

        <div class="card">
          <p class="po-section-label">Entrada</p>
          <div class="fv-input-row">
            <input id="fvFile" type="file" class="fv-file-input" />
            <button id="fvBtnPaste" class="btn ghost"><i class="fa-solid fa-paste"></i> Colar texto</button>
          </div>
          <textarea id="fvTextInput" class="esc-textarea hidden mt-10" rows="6" placeholder="Cole aqui o conteúdo do arquivo..."></textarea>
          <button id="fvBtnProcess" class="btn primary mt-10" style="width:100%;font-size:15px;padding:12px;"><i class="fa-solid fa-cogs"></i> Processar</button>
        </div>

        <div id="fvResult" class="card hidden">
          <div id="fvResultStatus" class="dv-result-status"></div>
          <pre id="fvResultDetails" class="dv-result-pre"></pre>
        </div>
      </div>
    `;
}

export function bindFileValidatorEvents(container) {
    let currentType = 'xml';
    let fileContent = null;

    setupSegmented(container.querySelector('#fvSegType'), btn => {
        currentType = btn.dataset.ftype;
        _showResult(container, 'info', 'Selecione um arquivo ou cole o conteúdo para processar.', '');
    });

    container.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;

        if (btn.id === 'fvBtnPaste') {
            const ta = container.querySelector('#fvTextInput');
            ta.classList.toggle('hidden');
            if (!ta.classList.contains('hidden')) ta.focus();
        }
        if (btn.id === 'fvBtnProcess') {
            const fileInput = container.querySelector('#fvFile');
            const textInput = container.querySelector('#fvTextInput');
            if (fileInput.files.length > 0) {
                const reader = new FileReader();
                reader.onload = ev => _process(container, currentType, ev.target.result, fileInput.files[0].name);
                reader.readAsText(fileInput.files[0]);
            } else if (!textInput.classList.contains('hidden') && textInput.value.trim()) {
                _process(container, currentType, textInput.value, 'texto colado');
            } else {
                _showResult(container, 'error', 'Nenhum arquivo ou texto fornecido.', '');
            }
        }
    });
}

function _process(container, type, content, filename) {
    switch (type) {
        case 'xml': return _processXML(container, content, filename);
        case 'afd': return _processAFD(container, content, filename);
        case 'afdt': return _processAFDT(container, content, filename);
        case 'cnpj': return _extractCNPJ(container, content, filename);
    }
}

function _processXML(container, content, filename) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/xml');
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            _showResult(container, 'error', 'XML inválido. Verifique a sintaxe.', parseError.textContent);
            return;
        }

        const infNFe = doc.querySelector('infNFe');
        if (!infNFe) {
            _showResult(container, 'error', 'Não é uma NFe/NFCe válida (tag infNFe não encontrada).', '');
            return;
        }

        const ide = doc.querySelector('ide');
        const emit = doc.querySelector('emit');
        const dest = doc.querySelector('dest');
        const total = doc.querySelector('total > ICMSTot');
        const prot = doc.querySelector('protNFe');

        const info = [];
        info.push(`Arquivo: ${filename}`);
        info.push(`Tipo: ${doc.querySelector('NFe') ? 'NFe' : 'NFCe'}`);
        info.push('');

        if (ide) {
            info.push('── IDENTIFICAÇÃO ──');
            info.push(`Mod: ${ide.querySelector('mod')?.textContent || '-'}`);
            info.push(`Série: ${ide.querySelector('serie')?.textContent || '-'}`);
            info.push(`Número: ${ide.querySelector('nNF')?.textContent || '-'}`);
            info.push(`Data Emissão: ${ide.querySelector('dhEmi')?.textContent || ide.querySelector('dEmi')?.textContent || '-'}`);
            info.push('');
        }

        if (emit) {
            info.push('── EMITENTE ──');
            info.push(`CNPJ: ${emit.querySelector('CNPJ')?.textContent || '-'}`);
            info.push(`Nome: ${emit.querySelector('xNome')?.textContent || '-'}`);
            info.push(`IE: ${emit.querySelector('IE')?.textContent || '-'}`);
            info.push(`UF: ${emit.querySelector('UF')?.textContent || '-'}`);
            info.push('');
        }

        if (dest) {
            info.push('── DESTINATÁRIO ──');
            info.push(`CNPJ/CPF: ${dest.querySelector('CNPJ')?.textContent || dest.querySelector('CPF')?.textContent || '-'}`);
            info.push(`Nome: ${dest.querySelector('xNome')?.textContent || '-'}`);
            info.push('');
        }

        if (total) {
            info.push('── TOTAIS ──');
            info.push(`Valor Produtos: R$ ${total.querySelector('vProd')?.textContent || '-'}`);
            info.push(`Valor Total: R$ ${total.querySelector('vNF')?.textContent || '-'}`);
            info.push('');
        }

        if (prot) {
            info.push('── PROTOCOLO ──');
            info.push(`Número: ${prot.querySelector('nProt')?.textContent || '-'}`);
            info.push(`Status: ${prot.querySelector('cStat')?.textContent || '-'} - ${prot.querySelector('xMotivo')?.textContent || '-'}`);
            info.push('');
        }

        _showResult(container, 'valid', 'XML válido e processado!', info.join('\n'));
    } catch (err) {
        _showResult(container, 'error', `Erro ao processar XML: ${err.message}`, '');
    }
}

function _processAFD(container, content, filename) {
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length === 0) {
        _showResult(container, 'error', 'Arquivo AFD vazio.', '');
        return;
    }

    const info = [];
    info.push(`Arquivo: ${filename}`);
    info.push(`Total de registros: ${lines.length}`);
    info.push('');

    const types = { '1': 'Header', '2': 'Empregador', '3': 'Empregado', '4': 'Marcação', '5': 'Trailler' };
    const typeCount = {};
    const employees = [];
    const marks = [];

    lines.forEach((line, idx) => {
        const type = line.substring(9, 10).trim();
        typeCount[type] = (typeCount[type] || 0) + 1;

        if (type === '2') {
            const cnpj = line.substring(20, 34);
            const name = line.substring(40, 100).trim();
            employees.push({ cnpj, name });
        }
        if (type === '3') {
            const pis = line.substring(20, 32);
            const name = line.substring(40, 100).trim();
            employees.push({ pis, name });
        }
        if (type === '4') {
            const pis = line.substring(20, 32);
            const date = line.substring(32, 40);
            const time = line.substring(40, 46);
            marks.push({ pis, date: `${date.substring(0,4)}/${date.substring(4,6)}/${date.substring(6,8)}`, time: `${time.substring(0,2)}:${time.substring(2,4)}` });
        }
    });

    info.push('── RESUMO ──');
    Object.entries(typeCount).forEach(([t, c]) => info.push(`Tipo ${t} (${types[t] || 'Desconhecido'}): ${c}`));
    info.push('');

    if (employees.length > 0) {
        info.push('── EMPREGADOS / EMPREGADOR ──');
        employees.slice(0, 10).forEach(e => info.push(`${e.cnpj || e.pis} - ${e.name}`));
        if (employees.length > 10) info.push(`... e mais ${employees.length - 10} registros`);
        info.push('');
    }

    if (marks.length > 0) {
        info.push('── MARCAÇÕES (primeiras 10) ──');
        marks.slice(0, 10).forEach(m => info.push(`PIS: ${m.pis} - ${m.date} ${m.time}`));
        if (marks.length > 10) info.push(`... e mais ${marks.length - 10} marcações`);
    }

    _showResult(container, 'valid', 'Arquivo AFD processado!', info.join('\n'));
}

function _processAFDT(container, content, filename) {
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length === 0) {
        _showResult(container, 'error', 'Arquivo AFDT vazio.', '');
        return;
    }

    const info = [];
    info.push(`Arquivo: ${filename}`);
    info.push(`Total de registros: ${lines.length}`);
    info.push('');

    const typeCount = {};
    const marks = [];

    lines.forEach((line, idx) => {
        const fields = line.split(';');
        if (fields.length >= 6) {
            const type = (fields[0] || '').trim();
            typeCount[type] = (typeCount[type] || 0) + 1;
            if (['2', '3'].includes(type) || (fields[2] && fields[3])) {
                marks.push({ pis: fields[2] || '', date: fields[3] || '', time: fields[4] || '', type });
            }
        }
    });

    info.push('── RESUMO ──');
    Object.entries(typeCount).forEach(([t, c]) => info.push(`Tipo ${t}: ${c}`));
    info.push('');

    if (marks.length > 0) {
        info.push('── MARCAÇÕES (primeiras 10) ──');
        marks.slice(0, 10).forEach(m => info.push(`PIS: ${m.pis} - ${m.date} ${m.time} (Tipo: ${m.type})`));
        if (marks.length > 10) info.push(`... e mais ${marks.length - 10} marcações`);
    }

    _showResult(container, 'valid', 'Arquivo AFDT processado!', info.join('\n'));
}

function _extractCNPJ(container, content, filename) {
    const cnpjRegex = /\b(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})\b/g;
    const ieRegex = /\b(\d{6,14}-?\d{0,2})\b/g;
    const cpfs = content.match(cnpjRegex) || [];
    const iesRaw = content.match(ieRegex) || [];
    const uniqueCNPJs = [...new Set(cpfs)];
    const uniqueIEs = [...new Set(iesRaw.filter(ie => ie.length >= 8 && !uniqueCNPJs.includes(ie)))];

    const info = [];
    info.push(`Arquivo: ${filename}`);
    info.push('');

    if (uniqueCNPJs.length > 0) {
        info.push('── CNPJs ENCONTRADOS ──');
        uniqueCNPJs.forEach(c => info.push(c));
        info.push('');
    }

    if (uniqueIEs.length > 0) {
        info.push('── INSCRIÇÕES ESTADUAIS (possíveis) ──');
        uniqueIEs.slice(0, 20).forEach(ie => info.push(ie));
        if (uniqueIEs.length > 20) info.push(`... e mais ${uniqueIEs.length - 20}`);
    }

    if (uniqueCNPJs.length === 0 && uniqueIEs.length === 0) {
        _showResult(container, 'error', 'Nenhum CNPJ ou IE encontrado no texto.', '');
    } else {
        _showResult(container, 'valid', `${uniqueCNPJs.length} CNPJ(s) e ${uniqueIEs.length} IE(s) encontrados.`, info.join('\n'));
    }
}

function _showResult(container, type, message, details) {
    const result = container.querySelector('#fvResult');
    const status = container.querySelector('#fvResultStatus');
    const det = container.querySelector('#fvResultDetails');
    if (!result || !status || !det) return;

    const stateMap = { valid: 'ok', error: 'error', info: 'info' };
    setStatusBadge(status, stateMap[type] || 'error');
    status.innerHTML = `<i class="fa-solid fa-circle-${type === 'valid' ? 'check' : type === 'info' ? 'info' : 'exclamation'}"></i> ${message}`;
    result.classList.remove('hidden');
    det.textContent = details || '';
}