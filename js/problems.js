import { 
    db, el,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    writeBatch
} from './firebase.js';

import { showModal } from './modal.js';
import { showToast } from './toast.js';
import { escapeHtml, escapeAttr } from './utils.js';

let currentUserId = null;
let allProblems = [];
let uiInitialized = false;
let dragSrcProblem = null;

// Status possíveis para soluções
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

    el('btnAddSolution').onclick = () => {
        const simpleEditor = el('problemSolution');
        const multiList = el('solutionEditorsList');
        const isMulti = !multiList.classList.contains('hidden');
        if (!isMulti) {
            const existingContent = simpleEditor.innerHTML.trim();
            simpleEditor.classList.add('hidden');
            multiList.classList.remove('hidden');
            renderSolutionEditors(multiList, existingContent ? [{ label: 'Solução 1', text: existingContent, status: 'confirmed' }] : []);
            addSolutionEditor(multiList);
        } else {
            addSolutionEditor(multiList);
        }
    };

    el('btnAddProblem').onclick = async () => {
        const title       = el('problemTitle').value.trim();
        const description = el('problemDesc').value.trim();
        const category    = el('problemCategory').value.trim();
        const isMulti     = !el('solutionEditorsList').classList.contains('hidden');

        let solutions;
        if (isMulti) {
            solutions = collectSolutions(el('solutionEditorsList'));
        } else {
            const text = el('problemSolution').innerHTML.trim();
            solutions = (text && text !== '<br>') ? [{ label: 'Solução 1', text, status: 'confirmed' }] : [];
        }

        if (!title) return showModal("O título do problema é obrigatório.");
        if (solutions.length === 0) return showModal("A solução é obrigatória.");

        try {
            await addDoc(collection(db, 'users', currentUserId, 'problems'), {
                title, description, solutions,
                category: category || 'Geral',
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

    el('problemSearch').oninput = () => applyFilters();

    // Filtro de categoria
    el('problemCategoryFilter').onchange = () => applyFilters();

    // Exportar
    el('btnExportProblems').onclick = () => exportProblems();
}

// --- EDITORES DE SOLUÇÃO ---

function collectSolutions(container) {
    const items = container.querySelectorAll('.solution-editor-item');
    const solutions = [];
    items.forEach((item, i) => {
        const label  = item.querySelector('.solution-label-input')?.value.trim() || `Solução ${i + 1}`;
        const text   = item.querySelector('.rich-editor')?.innerHTML.trim();
        const status = item.querySelector('.solution-status-select')?.value || 'confirmed';
        if (text && text !== '<br>') solutions.push({ label, text, status });
    });
    return solutions;
}

function renderSolutionEditors(container, solutions = []) {
    container.innerHTML = '';
    if (solutions.length === 0) addSolutionEditor(container);
    else solutions.forEach(s => addSolutionEditor(container, s));
}

function addSolutionEditor(container, solution = null) {
    const index = container.querySelectorAll('.solution-editor-item').length + 1;
    const item = document.createElement('div');
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
        <div class="rich-editor solution-rich-editor" contenteditable="true"
             data-placeholder="Digite a solução... Cole imagens aqui">${solution ? sanitizeHtml(solution.text) : ''}</div>
    `;
    setupRichEditor(item.querySelector('.rich-editor'));
    item.querySelector('.btn-remove-solution').onclick = () => {
        if (container.querySelectorAll('.solution-editor-item').length === 1)
            return showModal("O problema deve ter pelo menos uma solução.");
        item.remove();
    };
    container.appendChild(item);
}

// --- COMPATIBILIDADE ---

function normalizeSolutions(item) {
    if (item.solutions && Array.isArray(item.solutions)) return item.solutions;
    if (item.solution) return [{ label: 'Solução 1', text: item.solution, status: 'confirmed' }];
    return [];
}

// --- CARREGAMENTO ---

async function loadProblems(userId) {
    const list = el('problemList');
    if (!list) return;

    try {
        const snap = await getDocs(collection(db, 'users', userId, 'problems'));

        allProblems = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999) || (b.createdAt || 0) - (a.createdAt || 0));

        // Popula o select de filtro de categorias
        populateCategoryFilter();

        applyFilters();
    } catch (err) {
        console.error("Erro ao carregar problemas:", err);
    }
}

function populateCategoryFilter() {
    const select = el('problemCategoryFilter');
    if (!select) return;
    const current = select.value;
    const cats = ['Todas', ...new Set(allProblems.map(p => p.category || 'Geral').sort())];
    select.innerHTML = cats.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
    select.value = cats.includes(current) ? current : 'Todas';
}

function applyFilters() {
    const query    = el('problemSearch')?.value.trim().toLowerCase() || '';
    const category = el('problemCategoryFilter')?.value || 'Todas';

    const filtered = allProblems.filter(item => {
        const solutions = normalizeSolutions(item);
        const solText   = solutions.map(s => s.text.replace(/<[^>]*>/g, '')).join(' ');
        const matchText = !query || `${item.title} ${item.description || ''} ${solText}`.toLowerCase().includes(query);
        const matchCat  = category === 'Todas' || (item.category || 'Geral') === category;
        return matchText && matchCat;
    });

    renderProblems(filtered);
}

function renderProblems(problems) {
    const list = el('problemList');
    list.innerHTML = '';

    if (problems.length === 0) {
        list.innerHTML = '<p class="sub center">Nenhum problema encontrado.</p>';
        return;
    }

    // Agrupar por categoria
    const groups = {};
    problems.forEach(item => {
        const cat = item.category || 'Geral';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
    });

    Object.entries(groups).forEach(([category, items]) => {
        const groupEl = document.createElement('div');
        groupEl.className = 'problem-group';
        groupEl.innerHTML = `<div class="problem-group-label">${escapeHtml(category)}</div>`;

        items.forEach(item => {
            const solutions = normalizeSolutions(item);
            const card = document.createElement('div');
            card.className = 'problem-card card';
            card.draggable = true;
            card.dataset.id = item.id;

            const solutionsHtml = solutions.map((s, i) => {
                const st = STATUS_LABELS[s.status] || STATUS_LABELS.confirmed;
                return `
                    <div class="accordion-item">
                        <button class="accordion-trigger" data-index="${i}">
                            <span>
                                <i class="fa-solid fa-lightbulb"></i>
                                ${escapeHtml(s.label || `Solução ${i + 1}`)}
                                <span class="solution-status-badge ${st.cls}">
                                    <i class="fa-solid ${st.icon}"></i> ${st.label}
                                </span>
                            </span>
                            <i class="fa-solid fa-chevron-down accordion-icon"></i>
                        </button>
                        <div class="accordion-body">
                            <div class="solution-text" data-solution-index="${i}">${sanitizeHtml(s.text)}</div>
                        </div>
                    </div>
                `;
            }).join('');

            card.innerHTML = `
                <div class="problem-header">
                    <h3 class="problem-title">${escapeHtml(item.title)}</h3>
                    <div class="problem-actions">
                        <button class="btn ghost btn-edit-problem"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn ghost btn-del-problem"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                ${item.description ? `<p class="problem-desc">${escapeHtml(item.description)}</p>` : ''}
                <div class="accordion">${solutionsHtml}</div>
            `;

            card.querySelectorAll('.accordion-trigger').forEach(trigger => {
                trigger.onclick = () => {
                    const body = trigger.nextElementSibling;
                    const icon = trigger.querySelector('.accordion-icon');
                    const isOpen = body.classList.contains('open');
                    body.classList.toggle('open', !isOpen);
                    icon.classList.toggle('rotated', !isOpen);
                };
            });

            card.querySelectorAll('.solution-text').forEach((elSol, i) => {
                elSol.onclick = async () => {
                    const textOnly = solutions[i]?.text.replace(/<[^>]*>/g, '').trim();
                    if (textOnly) {
                        try {
                            await navigator.clipboard.writeText(textOnly);
                            showToast("Solução copiada!");
                        } catch (err) { console.error(err); }
                    }
                };
            });

            card.querySelector('.btn-edit-problem').onclick = () => enterEditMode(card, item, currentUserId, solutions);
            card.querySelector('.btn-del-problem').onclick = async () => {
                try {
                    await deleteDoc(doc(db, 'users', currentUserId, 'problems', item.id));
                    showToast("Problema excluído!");
                    loadProblems(currentUserId);
                } catch (err) {
                    showModal("Erro ao excluir o problema.");
                }
            };

            card.ondragstart = () => { dragSrcProblem = card; card.classList.add('dragging'); };
            card.ondragend   = () => { card.classList.remove('dragging'); saveProblemOrder(currentUserId); };
            card.ondragover  = (e) => {
                e.preventDefault();
                const rect  = card.getBoundingClientRect();
                const after = e.clientY > rect.top + rect.height / 2;
                list.insertBefore(dragSrcProblem, after ? card.nextSibling : card);
            };

            groupEl.appendChild(card);
        });

        list.appendChild(groupEl);
    });
}

// --- MODO DE EDIÇÃO ---

function enterEditMode(card, item, userId, solutions) {
    card.innerHTML = `
        <input class="edit-title" type="text" value="${escapeAttr(item.title)}" placeholder="Título do problema..." />
        <textarea class="edit-desc" rows="3" placeholder="Descreva o problema...">${escapeHtml(item.description || '')}</textarea>
        <input class="edit-category" type="text" value="${escapeAttr(item.category || 'Geral')}" placeholder="Categoria..." />
        <div class="solution-editors-list edit-solutions-list"></div>
        <button class="btn ghost btn-add-solution-edit mt-10">
            <i class="fa-solid fa-plus"></i> Adicionar solução
        </button>
        <div class="flex-end mt-10">
            <button class="btn ghost btn-cancel-edit">Cancelar</button>
            <button class="btn primary btn-save-edit">Salvar</button>
        </div>
    `;

    const editContainer = card.querySelector('.edit-solutions-list');
    renderSolutionEditors(editContainer, solutions);
    card.querySelector('.btn-add-solution-edit').onclick = () => addSolutionEditor(editContainer);
    card.querySelector('.edit-title').focus();

    card.querySelector('.btn-save-edit').onclick = async () => {
        const title       = card.querySelector('.edit-title').value.trim();
        const description = card.querySelector('.edit-desc').value.trim();
        const category    = card.querySelector('.edit-category').value.trim() || 'Geral';
        const newSolutions = collectSolutions(editContainer);

        if (!title) return showModal("O título do problema é obrigatório.");
        if (newSolutions.length === 0) return showModal("Adicione pelo menos uma solução.");

        try {
            await updateDoc(doc(db, 'users', userId, 'problems', item.id), {
                title, description, category, solutions: newSolutions, solution: null
            });
            showToast("Problema atualizado!");
            loadProblems(userId);
        } catch (err) {
            showModal("Erro ao atualizar o problema.");
        }
    };

    card.querySelector('.btn-cancel-edit').onclick = () => loadProblems(userId);
}

// --- EXPORTAR ---

export function exportProblems() {
    if (allProblems.length === 0) return showModal("Nenhum problema para exportar.");
    const data = allProblems.map(({ id, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `problemas_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Problemas exportados!");
}

// --- UTILITÁRIOS ---

function clearProblemForm() {
    el('problemTitle').value = '';
    el('problemDesc').value  = '';
    el('problemCategory').value = '';
    el('problemSolution').innerHTML = '';
    el('problemSolution').classList.remove('hidden');
    el('solutionEditorsList').classList.add('hidden');
    el('solutionEditorsList').innerHTML = '';
}

function setupRichEditor(editor) {
    editor.addEventListener('paste', (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = document.createElement('img');
                    img.src = ev.target.result;
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
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
    } catch (err) {
        console.error("Erro ao salvar ordem:", err);
    }
}

function sanitizeHtml(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const allowed = new Set(['IMG', 'BR', 'P', 'DIV', '#text']);
    function clean(node) {
        [...node.childNodes].forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                if (!allowed.has(child.tagName)) {
                    node.replaceChild(document.createTextNode(child.textContent), child);
                } else {
                    if (child.tagName === 'IMG') {
                        const src = child.getAttribute('src');
                        [...child.attributes].forEach(a => child.removeAttribute(a.name));
                        if (src) child.setAttribute('src', src);
                    } else {
                        [...child.attributes].forEach(a => child.removeAttribute(a.name));
                    }
                    clean(child);
                }
            }
        });
    }
    clean(temp);
    return temp.innerHTML;
}
