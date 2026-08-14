// ============================================================
//  ticketSummary.js — Gerador de Sumário de Atendimento
// ============================================================
//  Formulário para gerar resumo padronizado de chamado:
//  Cliente, Sistema/Módulo, Causa Raiz, Solução Aplicada, Testes

export function buildTicketSummaryPanel() {
    return `
      <div id="poTool-ticketsummary" class="po-tool-panel hidden">
        <div class="card">
          <div class="po-card-header">
            <span class="po-card-icon">📝</span>
            <div>
              <h3 class="po-card-title">Gerador de Sumário de Atendimento</h3>
              <p class="sub">Gere resumos padronizados para colar no sistema de Tickets/CRM</p>
            </div>
          </div>
        </div>

        <div class="card">
          <p class="po-section-label">Dados do chamado</p>
          <div class="ts-grid">
            <div class="form-field">
              <label class="field-label" for="tsClient">Cliente <span class="sub">(obrigatório)</span></label>
              <input id="tsClient" type="text" class="dv-input" placeholder="Nome do cliente / empresa" />
            </div>
            <div class="form-field">
              <label class="field-label" for="tsSystem">Sistema/Módulo</label>
              <input id="tsSystem" type="text" class="dv-input" placeholder="Ex: PDV, Ponto, E-commerce" />
            </div>
            <div class="form-field">
              <label class="field-label" for="tsTicket">Nº do Chamado <span class="sub">(opcional)</span></label>
              <input id="tsTicket" type="text" class="dv-input" placeholder="Ex: #12345" />
            </div>
            <div class="form-field">
              <label class="field-label" for="tsType">Tipo</label>
              <select id="tsType" class="dv-select">
                <option value="Suporte">Suporte</option>
                <option value="Incidente">Incidente</option>
                <option value="Instalação">Instalação</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Atendimento">Atendimento</option>
              </select>
            </div>
          </div>
        </div>

        <div class="card">
          <p class="po-section-label">Descrição do atendimento</p>
          <div class="form-field mt-6">
            <label class="field-label" for="tsProblem">Problema relatado</label>
            <textarea id="tsProblem" class="esc-textarea" rows="3" placeholder="Descreva o problema relatado pelo cliente..."></textarea>
          </div>
          <div class="form-field mt-10">
            <label class="field-label" for="tsRootCause">Causa raiz</label>
            <textarea id="tsRootCause" class="esc-textarea" rows="3" placeholder="O que causou o problema?"></textarea>
          </div>
          <div class="form-field mt-10">
            <label class="field-label" for="tsSolution">Solução aplicada</label>
            <textarea id="tsSolution" class="esc-textarea" rows="3" placeholder="Quais ações foram tomadas para resolver?"></textarea>
          </div>
          <div class="form-field mt-10">
            <label class="field-label" for="tsTests">Testes realizados</label>
            <textarea id="tsTests" class="esc-textarea" rows="2" placeholder="Ex: Testado em 3 PDVs, homologado pelo cliente..."></textarea>
          </div>
        </div>

        <div class="card">
          <p class="po-section-label">Observações</p>
          <div class="ts-observations">
            <label class="esc-check"><input type="checkbox" id="tsReturned" /> <span>Cliente retornou para testes</span></label>
            <label class="esc-check"><input type="checkbox" id="tsPending" /> <span>Pendente de liberação</span></label>
            <label class="esc-check"><input type="checkbox" id="tsForwarded" /> <span>Encaminhado para outro setor</span></label>
          </div>
        </div>

        <div class="card" style="padding:16px 24px;">
          <button id="tsBtnGenerate" class="btn primary" style="width:100%;padding:13px;font-size:15px;justify-content:center;">
            <i class="fa-solid fa-file-lines"></i> Gerar Sumário
          </button>
        </div>

        <div id="tsOutput" class="card hidden">
          <div class="at-result-header">
            <span class="at-status-badge at-status-ok">✅ Pronto!</span>
            <button class="btn ghost po-btn-copy" data-id="tsRawOutput"><i class="fa-solid fa-copy"></i> Copiar</button>
          </div>
          <pre id="tsRawOutput" class="at-result-pre"></pre>
        </div>
      </div>
    `;
}

export function bindTicketSummaryEvents(container) {
    container.addEventListener('click', e => {
        if (e.target.closest('#tsBtnGenerate')) _generate(container);

        const copyBtn = e.target.closest('.po-btn-copy');
        if (copyBtn && copyBtn.dataset.id === 'tsRawOutput') {
            const el = container.querySelector('#tsRawOutput');
            navigator.clipboard.writeText(el._raw || el.textContent).then(() => {
                const prev = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado';
                setTimeout(() => { copyBtn.innerHTML = prev; }, 2000);
            });
        }
    });
}

function _generate(container) {
    const client = container.querySelector('#tsClient').value.trim();
    const system = container.querySelector('#tsSystem').value.trim();
    const ticket = container.querySelector('#tsTicket').value.trim();
    const type = container.querySelector('#tsType').value;
    const problem = container.querySelector('#tsProblem').value.trim();
    const rootCause = container.querySelector('#tsRootCause').value.trim();
    const solution = container.querySelector('#tsSolution').value.trim();
    const tests = container.querySelector('#tsTests').value.trim();
    const returned = container.querySelector('#tsReturned').checked;
    const pending = container.querySelector('#tsPending').checked;
    const forwarded = container.querySelector('#tsForwarded').checked;

    if (!client) {
        container.querySelector('#tsClient').focus();
        container.querySelector('#tsClient').style.borderColor = 'var(--danger)';
        return;
    }

    const now = new Date();
    const date = now.toLocaleDateString('pt-BR');
    const time = now.toLocaleTimeString('pt-BR');

    const lines = [];
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Header
    let header = `📋 ${type}`;
    if (ticket) header += ` | ${ticket}`;
    lines.push(header);
    lines.push(`📅 ${date} às ${time}`);
    lines.push(`👤 Cliente: ${client}`);
    if (system) lines.push(`💻 Sistema: ${system}`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Problem
    if (problem) {
        lines.push(`🔴 Problema Relatado`);
        lines.push(problem);
        lines.push('');
    }

    // Root Cause
    if (rootCause) {
        lines.push(`🔍 Causa Raiz`);
        lines.push(rootCause);
        lines.push('');
    }

    // Solution
    if (solution) {
        lines.push(`✅ Solução Aplicada`);
        lines.push(solution);
        lines.push('');
    }

    // Tests
    if (tests) {
        lines.push(`🧪 Testes Realizados`);
        lines.push(tests);
        lines.push('');
    }

    // Observations
    const obs = [];
    if (returned) obs.push('✓ Cliente retornou para testes');
    if (pending) obs.push('⏳ Pendente de liberação');
    if (forwarded) obs.push('→ Encaminhado para outro setor');
    if (obs.length > 0) {
        lines.push(`📌 Observações`);
        obs.forEach(o => lines.push(o));
        lines.push('');
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`Atendimento registrado por PainelAtende`);

    const text = lines.join('\n');

    const output = container.querySelector('#tsOutput');
    const pre = container.querySelector('#tsRawOutput');
    output.classList.remove('hidden');
    pre._raw = text;
    pre.textContent = text;
    setTimeout(() => output.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}