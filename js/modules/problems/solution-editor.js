import { showModal } from '../../core/modal.js';
import { escapeHtml, escapeAttr, sanitizeHtml } from '../../core/utils.js';

const MAX_PASTE_IMAGE_SIZE = 800 * 1024;

export function setupRichEditor(editor) {
    editor.addEventListener('paste', (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (!file) return;
                if (file.size > MAX_PASTE_IMAGE_SIZE) {
                    showModal(`Imagem muito grande (${Math.round(file.size / 1024)}KB). Limite: ${MAX_PASTE_IMAGE_SIZE / 1024}KB. Comprima antes de colar.`);
                    return;
                }
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = document.createElement('img');
                    img.src   = ev.target.result;
                    const sel = window.getSelection();
                    if (sel.rangeCount > 0) {
                        const range = sel.getRangeAt(0);
                        range.deleteContents();
                        range.insertNode(img);
                        range.collapse(false);
                    } else {
                        editor.appendChild(img);
                    }
                };
                reader.readAsDataURL(file);
                return;
            }
        }
    });
}

export function collectSolutions(container) {
    const items = container.querySelectorAll('.solution-editor-item');
    const solutions = [];
    items.forEach((item, i) => {
        const label      = item.querySelector('.solution-label-input')?.value.trim() || `Solução ${i + 1}`;
        const text       = item.querySelector('.rich-editor')?.innerHTML.trim();
        const status     = item.querySelector('.solution-status-select')?.value || 'confirmed';
        const copyTexts = [...item.querySelectorAll('.copy-text-row')].map(row => ({
            label: row.querySelector('.copy-text-label-input')?.value.trim() || '',
            text:  row.querySelector('.copy-text-editor')?.value.trim() || ''
        })).filter(ct => ct.text);
        if (text && text !== '<br>') solutions.push({ label, text, status, copyTexts });
    });
    return solutions;
}

export function addCopyTextField(container, entry = null) {
    const existingLabel = typeof entry === 'object' ? (entry?.label || '') : '';
    const existingText  = typeof entry === 'string'  ? entry : (entry?.text || '');

    const row = document.createElement('div');
    row.className = 'copy-text-row';
    row.innerHTML = `
        <div class="copy-text-row-fields">
            <input class="copy-text-label-input" type="text"
                   placeholder="Título (ex: Comando, Link, Script...)"
                   value="${escapeAttr(existingLabel)}" />
            <textarea class="copy-text-editor" placeholder="Texto que será copiado ao clicar...">${escapeHtml(existingText)}</textarea>
        </div>
        <button class="btn ghost btn-remove-copy-text" title="Remover">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;
    row.querySelector('.btn-remove-copy-text').onclick = () => row.remove();
    container.appendChild(row);
}

export function renderSolutionEditors(container, solutions = []) {
    container.innerHTML = '';
    if (solutions.length === 0) addSolutionEditor(container);
    else solutions.forEach(s => addSolutionEditor(container, s));
}

export function addSolutionEditor(container, solution = null) {
    const index = container.querySelectorAll('.solution-editor-item').length + 1;
    const item  = document.createElement('div');
    item.className = 'solution-editor-item';
    const labelId = `solution-label-${Date.now()}-${index}`;
    const editorId = `solution-editor-${Date.now()}-${index}`;
    item.innerHTML = `
        <div class="solution-editor-header">
            <input class="solution-label-input" id="${labelId}" type="text"
                   placeholder="Título da solução (ex: Solução ${index})"
                   value="${solution ? escapeAttr(solution.label) : ''}"
                   aria-label="Título da solução ${index}" />
            <select class="solution-status-select" aria-label="Status da solução ${index}">
                <option value="confirmed" ${(!solution || solution.status === 'confirmed') ? 'selected' : ''}>✅ Confirmada</option>
                <option value="testing"   ${solution?.status === 'testing'  ? 'selected' : ''}>🧪 Em teste</option>
                <option value="obsolete"  ${solution?.status === 'obsolete' ? 'selected' : ''}>❌ Obsoleta</option>
            </select>
            <button class="btn ghost btn-remove-solution" title="Remover solução" aria-label="Remover solução ${index}">
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
        </div>
        <div class="rich-editor solution-rich-editor" contenteditable="true" role="textbox" aria-multiline="true"
             id="${editorId}" aria-labelledby="${labelId}" aria-label="Solução ${index}"
             data-placeholder="Digite a solução... Cole imagens aqui">${solution ? sanitizeHtml(solution.text) : ''}</div>
        <div class="copy-texts-section">
            <label class="field-label mt-8">
                Textos para copiar <span class="sub">(cada um vira um botão de cópia)</span>
            </label>
            <div class="copy-texts-list"></div>
            <button class="btn ghost btn-add-copy-text align-self-start mt-6">
                <i class="fa-solid fa-plus"></i> Adicionar texto para copiar
            </button>
        </div>
    `;
    setupRichEditor(item.querySelector('.rich-editor'));

    const copyList = item.querySelector('.copy-texts-list');
    const existingCopyTexts = solution?.copyTexts || (solution?.copyText ? [{ label: '', text: solution.copyText }] : []);
    if (existingCopyTexts.length > 0) {
        existingCopyTexts.forEach(ct => addCopyTextField(copyList, ct));
    }
    item.querySelector('.btn-add-copy-text').onclick = () => addCopyTextField(copyList);

    item.querySelector('.btn-remove-solution').onclick = () => {
        if (container.querySelectorAll('.solution-editor-item').length === 1)
            return showModal("O problema deve ter pelo menos uma solução.");
        item.remove();
    };
    container.appendChild(item);
}
