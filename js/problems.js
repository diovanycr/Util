import { 
    db, el,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    writeBatch,
    query,
    orderBy,
    limit,
    startAfter,
    where
} from './firebase.js';

import { showModal, openConfirmModal } from './modal.js';
import { showToast } from './toast.js';
import { escapeHtml, escapeAttr, sanitizeHtml, addKeyboardDragSupport, normalizeSolutions, getTagColor, debounce } from './utils.js';

let currentUserId = null;
export let allProblems   = [];
let uiInitialized = false;
let dragSrcProblem = null;
let activeTagFilter = null;
let _lastProblemDoc = null;
const PROBLEM_PAGE_SIZE = 50; // tag selecionada no filtro

const STATUS_LABELS = {
    confirmed: { label: 'Confirmada', icon: 'fa-circle-check', cls: 'status-confirmed' },
    testing:   { label: 'Em teste',   icon: 'fa-flask',        cls: 'status-testing'   },
    obsolete:  { label: 'Obsoleta',   icon: 'fa-circle-xmark', cls: 'status-obsolete'  }
};

export function initProblems(uid) {
    currentUserId = uid;
    if (!uiInitialized) {
        setupProblemInterface();
        uiInitialized = true;
    }
    loadProblems(uid);
}

export function resetProblems() {
    uiInitialized = false;
    currentUserId = null;
    activeTagFilter = null;
}

// --- SETUP DA INTERFACE ---

function setupProblemInterface() {
    el('btnNewProblem').onclick = () => {
        el('newProblemBox').classList.remove('hidden');
        el('problemTitle').focus();
    };

    el('btnCancelProblem').onclick = () => {
        clearProblemForm();
        el('newProblemBox').classList.add('hidden');
    };

    setupRichEditor(el('problemSolution'));

    // Botão adicionar texto para copiar no modo simples
    el('btnAddSimpleCopyText').onclick = () => {
        addCopyTextField(el('simpleCopyTextsList'));
    };
    setupTagInput(el('problemTagInput'), el('tagPillsCreate'));

    el('btnAddSolution').onclick = () => {
        const simpleEditor = el('problemSolution');
        const multiList    = el('solutionEditorsList');
        const isMulti      = !multiList.classList.contains('hidden');
        if (!isMulti) {
            const existingContent = simpleEditor.innerHTML.trim();
            simpleEditor.classList.add('hidden');
            el('problemSolutionHeader').classList.add('hidden');
            el('simpleCopyTextsSection').classList.add('hidden');
            multiList.classList.remove('hidden');
            renderSolutionEditors(multiList, existingContent
                ? [{ label: 'Solução 1', text: existingContent, status: 'confirmed' }]
                : []);
            addSolutionEditor(multiList);
        } else {
            addSolutionEditor(multiList);
        }
    };

    el('btnAddProblem').onclick = async () => {
        const title       = el('problemTitle').value.trim();
        const description = el('problemDesc').value.trim();
        const tags        = getTagsFromPills(el('tagPillsCreate'));
        const isMulti     = !el('solutionEditorsList').classList.contains('hidden');

        let solutions;
        if (isMulti) {
            solutions = collectSolutions(el('solutionEditorsList'));
        } else {
            const text      = el('problemSolution').innerHTML.trim();
            const status    = el('problemSolutionStatus').value || 'confirmed';
            const label     = el('problemSolutionLabel').value.trim() || 'Solução 1';
            const copyTexts = [...el('simpleCopyTextsList').querySelectorAll('.copy-text-row')].map(row => ({
                label: row.querySelector('.copy-text-label-input')?.value.trim() || '',
                text:  row.querySelector('.copy-text-editor')?.value.trim() || ''
            })).filter(ct => ct.text);
            solutions  = (text && text !== '<br>') ? [{ label, text, status, copyTexts }] : [];
        }

        if (!title) return showModal("O título do problema é obrigatório.");
        if (solutions.length === 0) return showModal("A solução é obrigatória.");

        try {
            await addDoc(collection(db, 'users', currentUserId, 'problems'), {
                title, description, solutions, tags,
                createdAt: Date.now()
            });
            clearProblemForm();
            el('newProblemBox').classList.add('hidden');
            showToast("Problema salvo!");
            loadProblems(currentUserId);
        } catch (e) {
            console.error(e);
            showModal("Erro ao salvar o problema.");
        }
    };

    el('problemSearch').oninput = debounce(() => applyFilters(), 200);
    el('btnExportProblems').onclick = () => exportProblems();
    el('btnImportProblems').onclick = () => el('importProblemsInput').click();
    el('importProblemsInput').onchange = (e) => importProblems(e, currentUserId);
}

// --- TAG INPUT ---

function setupTagInput(input, pillsContainer) {
    if (!input || !pillsContainer) return;

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTagPill(input.value, pillsContainer);
            input.value = '';
        }
        // Backspace remove última tag se input vazio
        if (e.key === 'Backspace' && input.value === '') {
            const last = pillsContainer.querySelector('.tag-pill:last-child');
            last?.remove();
        }
    });

    input.addEventListener('blur', () => {
        if (input.value.trim()) {
            addTagPill(input.value, pillsContainer);
            input.value = '';
        }
    });
}

function addTagPill(text, container) {
    if (!container) return;
    const tag = text.trim().replace(/,/g, '').toLowerCase();
    if (!tag) return;
    // Evita duplicata
    const existing = [...container.querySelectorAll('.tag-pill')].map(p => p.dataset.tag);
    if (existing.includes(tag)) return;

    const pill = document.createElement('span');
    pill.className = `tag-pill ${getTagColor(tag)}`;
    pill.dataset.tag = tag;
    pill.innerHTML = `${escapeHtml(tag)} <button class="tag-pill-remove" title="Remover">&times;</button>`;
    pill.querySelector('.tag-pill-remove').onclick = () => pill.remove();
    container.appendChild(pill);
}

function getTagsFromPills(container) {
    if (!container) return [];
    // Busca pills no próprio container e também no wrapper pai (por causa do display:contents)
    const el = container.closest('.tag-input-wrapper') || container;
    return [...el.querySelectorAll('.tag-pill')].map(p => p.dataset.tag).filter(Boolean);
}

function renderTagPills(container, tags = [], removable = true) {
    container.innerHTML = '';
    tags.forEach(tag => {
        const pill = document.createElement('span');
        pill.className = `tag-pill ${getTagColor(tag)}`;
        pill.dataset.tag = tag;
        if (removable) {
            pill.innerHTML = `${escapeHtml(tag)} <button class="tag-pill-remove" title="Remover">&times;</button>`;
            pill.querySelector('.tag-pill-remove').onclick = () => pill.remove();
        } else {
            pill.textContent = tag;
        }
        container.appendChild(pill);
    });
}

// --- EDITORES DE SOLUÇÃO ---

function collectSolutions(container) {
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

function addCopyTextField(container, entry = null) {
    // entry pode ser string (legado) ou { label, text }
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

function renderSolutionEditors(container, solutions = []) {
    container.innerHTML = '';
    if (solutions.length === 0) addSolutionEditor(container);
    else solutions.forEach(s => addSolutionEditor(container, s));
}

function addSolutionEditor(container, solution = null) {
    const index = container.querySelectorAll('.solution-editor-item').length + 1;
    const item  = document.createElement('div');
    item.className = 'solution-editor-item';
    item.innerHTML = `
        <div class="solution-editor-header">
            <input class="solution-label-input" type="text"
                   placeholder="Título da solução (ex: Solução ${index})"
                   value="${solution ? escapeAttr(solution.label) : ''}" />
            <select class="solution-status-select">
                <option value="confirmed" ${(!solution || solution.status === 'confirmed') ? 'selected' : ''}>✅ Confirmada</option>
                <option value="testing"   ${solution?.status === 'testing'  ? 'selected' : ''}>🧪 Em teste</option>
                <option value="obsolete"  ${solution?.status === 'obsolete' ? 'selected' : ''}>❌ Obsoleta</option>
            </select>
            <button class="btn ghost btn-remove-solution" title="Remover solução">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <div class="rich-editor solution-rich-editor" contenteditable="true" role="textbox" aria-multiline="true"
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

    // Popula copyTexts existentes ou adiciona campo vazio
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

// --- NORMALIZAÇÃO ---

function normalizeTags(item) {
    if (Array.isArray(item.tags)) return item.tags;
    if (item.category && item.category !== 'Geral') return [item.category.toLowerCase()];
    return [];
}

// --- CARREGAMENTO ---

export async function loadProblems(userId, append = false) {
    const list = el('problemList');
    if (!list) return;

    if (!append) {
        list.innerHTML = `
            <div class="loading-state">
                <span class="spinner"></span>
                <span>Carregando problemas...</span>
            </div>
        `;
        _lastProblemDoc = null;
        allProblems = [];
    }

    try {
        let q = query(collection(db, 'users', userId, 'problems'), orderBy('createdAt', 'desc'), limit(PROBLEM_PAGE_SIZE));
        if (_lastProblemDoc) q = query(collection(db, 'users', userId, 'problems'), orderBy('createdAt', 'desc'), startAfter(_lastProblemDoc), limit(PROBLEM_PAGE_SIZE));

        const snap = await getDocs(q);

        if (snap.empty && !append) {
            list.innerHTML = '<p class="sub">Nenhum problema cadastrado.</p>';
            updateTagFilterBar();
            applyFilters();
            const event = new CustomEvent('updateProblemCount', { detail: allProblems.length });
            document.dispatchEvent(event);
            return;
        }

        _lastProblemDoc = snap.docs[snap.docs.length - 1];

        const newProblems = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999) || (b.createdAt || 0) - (a.createdAt || 0));

        allProblems.push(...newProblems);

        if (append) {
            // Adiciona apenas os novos cards ao DOM
            newProblems.forEach(p => renderProblemCard(p, list, currentUserId));
            // Reaplica filtros atuais
            applyFilters();
        } else {
            renderProblems();
        }

        // Botão "Carregar mais" se houver mais registros
        if (snap.docs.length === PROBLEM_PAGE_SIZE) {
            const loadMoreBtn = document.createElement('div');
            loadMoreBtn.style.cssText = 'display:flex;justify-content:center;margin-top:12px;';
            loadMoreBtn.innerHTML = '<button class="btn ghost" id="btnLoadMoreProblems"><i class="fa-solid fa-chevron-down"></i> Carregar mais problemas</button>';
            list.appendChild(loadMoreBtn);
            loadMoreBtn.querySelector('#btnLoadMoreProblems').onclick = () => { loadMoreBtn.remove(); loadProblems(currentUserId, true); };
        }

        // Atualiza contador na aba
        const event = new CustomEvent('updateProblemCount', { detail: allProblems.length });
        document.dispatchEvent(event);
    } catch (err) {
        console.error("Erro ao carregar problemas:", err);
        list.innerHTML = `<div class="empty-state-container"><i class="fa-solid fa-triangle-exclamation empty-state-icon"></i><p class="empty-state-title">Erro ao carregar problemas</p></div>`;
    }
}

// --- FILTRO POR TAGS (chips na toolbar) ---

function updateTagFilterBar() {
    const bar = el('tagFilterBar');
    if (!bar) return;

    // Coleta todas as tags únicas
    const allTags = [...new Set(allProblems.flatMap(p => normalizeTags(p)))].sort();

    if (allTags.length === 0) {
        bar.classList.add('hidden');
        return;
    }

    bar.classList.remove('hidden');
    bar.innerHTML = '<span class="tag-filter-label">Filtrar:</span>';

    // Chip "Todas"
    const allChip = document.createElement('button');
    allChip.className = `tag-filter-chip ${!activeTagFilter ? 'active' : ''}`;
    allChip.textContent = 'Todas';
    allChip.setAttribute('aria-pressed', !activeTagFilter ? 'true' : 'false');
    allChip.onclick = () => { activeTagFilter = null; updateTagFilterBar(); applyFilters(); };
    bar.appendChild(allChip);

    allTags.forEach(tag => {
        const chip = document.createElement('button');
        chip.className = `tag-filter-chip ${getTagColor(tag)} ${activeTagFilter === tag ? 'active' : ''}`;
        chip.textContent = tag;
        chip.setAttribute('aria-pressed', activeTagFilter === tag ? 'true' : 'false');
        chip.onclick = () => {
            activeTagFilter = activeTagFilter === tag ? null : tag;
            updateTagFilterBar();
            applyFilters();
        };
        bar.appendChild(chip);
    });
}

function applyFilters() {
    const query = el('problemSearch')?.value.trim().toLowerCase() || '';

    const filtered = allProblems.filter(item => {
        const solutions = normalizeSolutions(item);
        const solText   = solutions.map(s => s.text.replace(/<[^>]*>/g, '')).join(' ');
        const tags      = normalizeTags(item);
        const matchText = !query || `${item.title} ${item.description || ''} ${solText} ${tags.join(' ')}`.toLowerCase().includes(query);
        const matchTag  = !activeTagFilter || tags.includes(activeTagFilter);
        return matchText && matchTag;
    });

    renderProblems(filtered);
}

function renderProblemCard(item, list, userId) {
        const solutions = normalizeSolutions(item);
        const tags      = normalizeTags(item);
        const card      = document.createElement('div');
        card.className  = 'problem-card card';
        card.draggable  = true;
        card.dataset.id = item.id;

        const solutionsHtml = solutions.map((s, i) => {
            const st = STATUS_LABELS[s.status] || STATUS_LABELS.confirmed;
            const accordionId = `problem-${item.id}-sol-${i}`;
            return `
                <div class="accordion-item">
                    <button class="accordion-trigger" data-index="${i}" aria-expanded="false" aria-controls="${accordionId}">
                        <span>
                            <i class="fa-solid fa-lightbulb" aria-hidden="true"></i>
                            ${escapeHtml(s.label || `Solução ${i + 1}`)}
                            <span class="solution-status-badge ${st.cls}">
                                <i class="fa-solid ${st.icon}" aria-hidden="true"></i> ${st.label}
                            </span>
                        </span>
                        <i class="fa-solid fa-chevron-down accordion-icon" aria-hidden="true"></i>
                    </button>
                    <div id="${accordionId}" class="accordion-body">
                        <div class="solution-text">${sanitizeHtml(s.text)}</div>
                        <div class="solution-copy-fields">
                        ${(() => {
                            const cts = s.copyTexts?.length ? s.copyTexts
                                      : s.copyText          ? [s.copyText]
                                      : [];
                            if (cts.length === 0) return `
                                <div class="solution-copy-field" data-sol-index="${i}" data-ct-index="0" tabindex="0" role="button" aria-label="Copiar texto da solução">
                                    <i class="fa-solid fa-copy copy-field-icon" aria-hidden="true"></i>
                                    <span class="solution-copy-field-text">Clique para copiar o texto completo</span>
                                    <span class="solution-copy-field-hint"><i class="fa-solid fa-hand-pointer" aria-hidden="true"></i></span>
                                </div>`;
                            return cts.map((ct, ci) => `
                                <div class="solution-copy-field" data-sol-index="${i}" data-ct-index="${ci}" tabindex="0" role="button" aria-label="Copiar ${ct.label ? escapeAttr(ct.label) : 'texto'}">
                                    <i class="fa-solid fa-copy copy-field-icon" aria-hidden="true"></i>
                                    <div class="solution-copy-field-info">
                                        ${ct.label ? `<span class="solution-copy-field-label">${escapeHtml(ct.label)}</span>` : ''}
                                        <span class="solution-copy-field-text">${escapeHtml(ct.text)}</span>
                                    </div>
                                    <span class="solution-copy-field-hint"><i class="fa-solid fa-hand-pointer" aria-hidden="true"></i> Copiar</span>
                                </div>`).join('');
                        })()}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const tagsHtml = tags.length
            ? `<div class="problem-tags">${tags.map(t => `<span class="tag-pill tag-pill-sm ${getTagColor(t)}">${escapeHtml(t)}</span>`).join('')}</div>`
            : '';

        card.innerHTML = `
            <div class="problem-header">
                <h3 class="problem-title">${escapeHtml(item.title)}</h3>
                <div class="problem-actions">
                    <button class="btn ghost problem-drag-handle" title="Reordenar problema"><i class="fa-solid fa-grip-lines" aria-hidden="true"></i></button>
                    <button class="btn ghost btn-edit-problem" aria-label="Editar problema"><i class="fa-solid fa-pen" aria-hidden="true"></i></button>
                    <button class="btn ghost btn-del-problem" aria-label="Excluir problema"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>
                </div>
            </div>
            ${item.description ? `<p class="problem-desc">${escapeHtml(item.description)}</p>` : ''}
            ${tagsHtml}
            <div class="accordion">${solutionsHtml}</div>
        `;

        card.querySelectorAll('.accordion-trigger').forEach(trigger => {
            trigger.onclick = () => {
                const body   = trigger.nextElementSibling;
                const icon   = trigger.querySelector('.accordion-icon');
                const isOpen = body.classList.contains('open');
                body.classList.toggle('open', !isOpen);
                icon.classList.toggle('rotated', !isOpen);
                trigger.setAttribute('aria-expanded', !isOpen);
            };
        });

        card.querySelectorAll('.solution-copy-field').forEach((field) => {
            const doCopy = async () => {
                const si  = parseInt(field.dataset.solIndex ?? 0);
                const ci  = parseInt(field.dataset.ctIndex  ?? 0);
                const s   = solutions[si];
                const cts = s?.copyTexts?.length ? s.copyTexts : [];
                const textToCopy = (typeof cts[ci] === 'object' ? cts[ci]?.text : cts[ci])
                                 ?? s?.text.replace(/<[^>]*>/g, '').trim()
                                 ?? '';
                if (textToCopy) {
                    try { await navigator.clipboard.writeText(textToCopy); showToast("Copiado!"); }
                    catch (err) { console.error(err); }
                }
            };
            field.onclick = doCopy;
            field.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    doCopy();
                }
            };
        });

        card.querySelector('.btn-edit-problem').onclick = () => enterEditMode(card, item, currentUserId, solutions, tags);
        card.querySelector('.btn-del-problem').onclick  = () => {
            openConfirmModal(
                async () => {
                    try {
                        await deleteDoc(doc(db, 'users', currentUserId, 'problems', item.id));
                        showToast("Problema excluído!");
                        loadProblems(currentUserId);
                    } catch (err) { showModal("Erro ao excluir o problema."); }
                },
                null,
                `Deseja realmente excluir o problema "${item.title}"? Esta ação não poderá ser desfeita.`
            );
        };

        card.ondragstart = () => { dragSrcProblem = card; card.classList.add('dragging'); };
        card.ondragend   = () => { card.classList.remove('dragging'); saveProblemOrder(currentUserId); };
        card.ondragover  = (e) => {
            e.preventDefault();
            const rect  = card.getBoundingClientRect();
            const after = e.clientY > rect.top + rect.height / 2;
            list.insertBefore(dragSrcProblem, after ? card.nextSibling : card);
        };

        // Drag-and-drop (teclado)
        const dragHandle = card.querySelector('.problem-drag-handle');
        if (dragHandle) {
            addKeyboardDragSupport(
                dragHandle,
                () => [...list.querySelectorAll('.problem-card')],
                () => saveProblemOrder(currentUserId)
            );
        }

        list.appendChild(card);
    }

    function renderProblems(problems) {
    const list = el('problemList');
    list.innerHTML = '';

    if (problems.length === 0) {
        list.innerHTML = `
            <div class="empty-state-container">
                <i class="fa-solid fa-circle-question empty-state-icon"></i>
                <p class="empty-state-title">Nenhum problema encontrado</p>
                <p class="empty-state-desc">Nenhum registro corresponde aos filtros ou pesquisa atuais.</p>
                <button class="btn primary mt-12 btn-cta-new-problem"><i class="fa-solid fa-plus"></i> Novo problema</button>
            </div>
        `;
        list.querySelector('.btn-cta-new-problem')?.addEventListener('click', () => {
            el('btnNewProblem')?.click();
        });
        return;
    }

    problems.forEach(item => {
        const solutions = normalizeSolutions(item);
        const tags      = normalizeTags(item);
        const card      = document.createElement('div');
        card.className  = 'problem-card card';
        card.draggable  = true;
        card.dataset.id = item.id;

        const solutionsHtml = solutions.map((s, i) => {
            const st = STATUS_LABELS[s.status] || STATUS_LABELS.confirmed;
            const accordionId = `problem-${item.id}-sol-${i}`;
            return `
                <div class="accordion-item">
                    <button class="accordion-trigger" data-index="${i}" aria-expanded="false" aria-controls="${accordionId}">
                        <span>
                            <i class="fa-solid fa-lightbulb" aria-hidden="true"></i>
                            ${escapeHtml(s.label || `Solução ${i + 1}`)}
                            <span class="solution-status-badge ${st.cls}">
                                <i class="fa-solid ${st.icon}" aria-hidden="true"></i> ${st.label}
                            </span>
                        </span>
                        <i class="fa-solid fa-chevron-down accordion-icon" aria-hidden="true"></i>
                    </button>
                    <div id="${accordionId}" class="accordion-body">
                        <div class="solution-text">${sanitizeHtml(s.text)}</div>
                        <div class="solution-copy-fields">
                        ${(() => {
                            const cts = s.copyTexts?.length ? s.copyTexts
                                      : s.copyText          ? [s.copyText]
                                      : [];
                            if (cts.length === 0) return `
                                <div class="solution-copy-field" data-sol-index="${i}" data-ct-index="0" tabindex="0" role="button" aria-label="Copiar texto da solução">
                                    <i class="fa-solid fa-copy copy-field-icon" aria-hidden="true"></i>
                                    <span class="solution-copy-field-text">Clique para copiar o texto completo</span>
                                    <span class="solution-copy-field-hint"><i class="fa-solid fa-hand-pointer" aria-hidden="true"></i></span>
                                </div>`;
                            return cts.map((ct, ci) => `
                                <div class="solution-copy-field" data-sol-index="${i}" data-ct-index="${ci}" tabindex="0" role="button" aria-label="Copiar ${ct.label ? escapeAttr(ct.label) : 'texto'}">
                                    <i class="fa-solid fa-copy copy-field-icon" aria-hidden="true"></i>
                                    <div class="solution-copy-field-info">
                                        ${ct.label ? `<span class="solution-copy-field-label">${escapeHtml(ct.label)}</span>` : ''}
                                        <span class="solution-copy-field-text">${escapeHtml(ct.text)}</span>
                                    </div>
                                    <span class="solution-copy-field-hint"><i class="fa-solid fa-hand-pointer" aria-hidden="true"></i> Copiar</span>
                                </div>`).join('');
                        })()}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const tagsHtml = tags.length
            ? `<div class="problem-tags">${tags.map(t => `<span class="tag-pill tag-pill-sm ${getTagColor(t)}">${escapeHtml(t)}</span>`).join('')}</div>`
            : '';

        card.innerHTML = `
            <div class="problem-header">
                <h3 class="problem-title">${escapeHtml(item.title)}</h3>
                <div class="problem-actions">
                    <button class="btn ghost problem-drag-handle" title="Reordenar problema"><i class="fa-solid fa-grip-lines" aria-hidden="true"></i></button>
                    <button class="btn ghost btn-edit-problem" aria-label="Editar problema"><i class="fa-solid fa-pen" aria-hidden="true"></i></button>
                    <button class="btn ghost btn-del-problem" aria-label="Excluir problema"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>
                </div>
            </div>
            ${item.description ? `<p class="problem-desc">${escapeHtml(item.description)}</p>` : ''}
            ${tagsHtml}
            <div class="accordion">${solutionsHtml}</div>
        `;

        card.querySelectorAll('.accordion-trigger').forEach(trigger => {
            trigger.onclick = () => {
                const body   = trigger.nextElementSibling;
                const icon   = trigger.querySelector('.accordion-icon');
                const isOpen = body.classList.contains('open');
                body.classList.toggle('open', !isOpen);
                icon.classList.toggle('rotated', !isOpen);
                trigger.setAttribute('aria-expanded', !isOpen);
            };
        });

        card.querySelectorAll('.solution-copy-field').forEach((field) => {
            const doCopy = async () => {
                const si  = parseInt(field.dataset.solIndex ?? 0);
                const ci  = parseInt(field.dataset.ctIndex  ?? 0);
                const s   = solutions[si];
                const cts = s?.copyTexts?.length ? s.copyTexts : [];
                const textToCopy = (typeof cts[ci] === 'object' ? cts[ci]?.text : cts[ci])
                                 ?? s?.text.replace(/<[^>]*>/g, '').trim()
                                 ?? '';
                if (textToCopy) {
                    try { await navigator.clipboard.writeText(textToCopy); showToast("Copiado!"); }
                    catch (err) { console.error(err); }
                }
            };
            field.onclick = doCopy;
            field.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    doCopy();
                }
            };
        });

        card.querySelector('.btn-edit-problem').onclick = () => enterEditMode(card, item, currentUserId, solutions, tags);
        card.querySelector('.btn-del-problem').onclick  = () => {
            openConfirmModal(
                async () => {
                    try {
                        await deleteDoc(doc(db, 'users', currentUserId, 'problems', item.id));
                        showToast("Problema excluído!");
                        loadProblems(currentUserId);
                    } catch (err) { showModal("Erro ao excluir o problema."); }
                },
                null,
                `Deseja realmente excluir o problema "${item.title}"? Esta ação não poderá ser desfeita.`
            );
        };

        card.ondragstart = () => { dragSrcProblem = card; card.classList.add('dragging'); };
        card.ondragend   = () => { card.classList.remove('dragging'); saveProblemOrder(currentUserId); };
        card.ondragover  = (e) => {
            e.preventDefault();
            const rect  = card.getBoundingClientRect();
            const after = e.clientY > rect.top + rect.height / 2;
            list.insertBefore(dragSrcProblem, after ? card.nextSibling : card);
        };

        // Drag-and-drop (teclado)
        const dragHandle = card.querySelector('.problem-drag-handle');
        if (dragHandle) {
            addKeyboardDragSupport(
                dragHandle,
                () => [...list.querySelectorAll('.problem-card')],
                () => saveProblemOrder(currentUserId)
            );
        }

        list.appendChild(card);
    });
    
    // Dispara evento para adicionar estrelas de favoritos
    document.dispatchEvent(new Event('itemsRendered'));
}

// --- MODO DE EDIÇÃO ---

function enterEditMode(card, item, userId, solutions, tags) {
    card.innerHTML = `
        <input class="edit-title" type="text" value="${escapeAttr(item.title)}" placeholder="Título do problema..." />
        <textarea class="edit-desc" rows="3" placeholder="Descreva o problema...">${escapeHtml(item.description || '')}</textarea>
        <div class="tag-input-wrapper">
            <div class="edit-tag-pills tag-pills-inline"></div>
            <input class="edit-tag-input" type="text" placeholder="Adicionar tag (Enter ou vírgula)..." autocomplete="off" />
        </div>
        <div class="solution-editors-list edit-solutions-list"></div>
        <button class="btn ghost btn-add-solution-edit mt-10">
            <i class="fa-solid fa-plus"></i> Adicionar solução
        </button>
        <div class="flex-end mt-10">
            <button class="btn ghost btn-cancel-edit">Cancelar</button>
            <button class="btn primary btn-save-edit">Salvar</button>
        </div>
    `;

    const pillsEl   = card.querySelector('.edit-tag-pills');
    const tagInput  = card.querySelector('.edit-tag-input');
    const editContainer = card.querySelector('.edit-solutions-list');

    renderTagPills(pillsEl, tags, true);
    setupTagInput(tagInput, pillsEl);
    renderSolutionEditors(editContainer, solutions);

    card.querySelector('.btn-add-solution-edit').onclick = () => addSolutionEditor(editContainer);
    card.querySelector('.edit-title').focus();

    card.querySelector('.btn-save-edit').onclick = async () => {
        const title        = card.querySelector('.edit-title').value.trim();
        const description  = card.querySelector('.edit-desc').value.trim();
        const newTags      = getTagsFromPills(pillsEl);
        const newSolutions = collectSolutions(editContainer);

        if (!title) return showModal("O título do problema é obrigatório.");
        if (newSolutions.length === 0) return showModal("Adicione pelo menos uma solução.");

        const saveBtn = card.querySelector('.btn-save-edit');
        const cancelBtn = card.querySelector('.btn-cancel-edit');
        const originalSaveText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        cancelBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Salvando...';

        try {
            await updateDoc(doc(db, 'users', userId, 'problems', item.id), {
                title, description, tags: newTags, solutions: newSolutions,
                solution: null, category: null
            });
            showToast("Problema atualizado!");
            loadProblems(userId);
        } catch (err) {
            showModal("Erro ao atualizar o problema.");
            saveBtn.disabled = false;
            cancelBtn.disabled = false;
            saveBtn.innerHTML = originalSaveText;
        }
    };

    card.querySelector('.btn-cancel-edit').onclick = () => loadProblems(userId);
}

// --- IMPORTAR ---

async function importProblems(e, userId) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    let data;
    try {
        const text = await file.text();
        data = JSON.parse(text);
    } catch {
        return showModal('Arquivo inválido. Selecione um JSON exportado pelo Painel Atende.');
    }

    if (!Array.isArray(data) || data.length === 0) {
        return showModal('O arquivo está vazio ou não contém problemas válidos.');
    }

    openConfirmModal(
        async () => {
            try {
                // Deduplica por título: ignora itens cujo título já existe na lista atual
                const existingTitles = new Set(allProblems.map(p => (p.title || '').toLowerCase()));
                const newItems = data.filter(item => !existingTitles.has((item.title || '').toLowerCase()));
                const duplicated = data.length - newItems.length;

                const BATCH_SIZE = 500;
                for (let i = 0; i < newItems.length; i += BATCH_SIZE) {
                    const batch = writeBatch(db);
                    newItems.slice(i, i + BATCH_SIZE).forEach(item => {
                        const ref = doc(collection(db, 'users', userId, 'problems'));
                        batch.set(ref, {
                            title:       item.title       || '',
                            description: item.description || '',
                            solutions:   Array.isArray(item.solutions) ? item.solutions : [],
                            tags:        Array.isArray(item.tags)      ? item.tags      : [],
                            order:       item.order       || 999,
                            createdAt:   item.createdAt   || Date.now()
                        });
                    });
                    await batch.commit();
                }
                
                let msg = `${newItems.length} problema(s) importado(s)!`;
                if (duplicated > 0) msg += ` ${duplicated} item(ns) já existiam e foram ignorados.`;
                showToast(msg);
                loadProblems(userId);
            } catch (err) {
                console.error(err);
                showModal('Erro ao importar problemas.');
            }
        },
        null,
        `Importar ${data.length} problema(s) do arquivo "${file.name}"? Itens duplicados (mesmo título) serão ignorados.`
    );
}

// --- EXPORTAR ---

export function exportProblems() {
    if (allProblems.length === 0) return showModal("Nenhum problema para exportar.");
    const data = allProblems.map(({ id, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `problemas_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Problemas exportados!");
}

// --- UTILITÁRIOS ---

function clearProblemForm() {
    el('problemTitle').value = '';
    el('problemDesc').value  = '';
    el('problemTagInput').value = '';
    el('tagPillsCreate').innerHTML = '';
    el('problemSolution').innerHTML = '';
    el('problemSolution').classList.remove('hidden');
    el('simpleCopyTextsList').innerHTML = '';
    el('simpleCopyTextsSection').classList.remove('hidden');
    el('problemSolutionStatus').value = 'confirmed';
    el('problemSolutionLabel').value = 'Solução 1';
    el('problemSolutionHeader').classList.remove('hidden');
    el('solutionEditorsList').classList.add('hidden');
    el('solutionEditorsList').innerHTML = '';
}

// Limite de tamanho para imagens coladas (base64 vira ~1.33x o tamanho do arquivo)
// 800KB no arquivo -> ~1MB no Firestore (limite do doc é 1MB)
const MAX_PASTE_IMAGE_SIZE = 800 * 1024;

function setupRichEditor(editor) {
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

async function saveProblemOrder(userId) {
    const list = el('problemList');
    if (!list) return;
    const cards = [...list.querySelectorAll('.problem-card')];
    try {
        const batch = writeBatch(db);
        cards.forEach((card, i) => {
            const id = card.dataset.id;
            if (id) batch.update(doc(db, 'users', userId, 'problems', id), { order: i + 1 });
        });
        await batch.commit();
    } catch (err) { console.error("Erro ao salvar ordem:", err); }
}


