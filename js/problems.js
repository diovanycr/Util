import { 
    db, el,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from './firebase.js';

import { showModal } from './modal.js';
import { showToast } from './toast.js';
import { escapeHtml, escapeAttr } from './utils.js';

let currentUserId = null;
let allProblems = [];
let uiInitialized = false;

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

    // Renderiza o container de soluções do formulário de criação
    renderSolutionEditors(el('solutionEditorsList'));

    el('btnAddSolution').onclick = () => {
        addSolutionEditor(el('solutionEditorsList'));
    };

    el('btnAddProblem').onclick = async () => {
        const title = el('problemTitle').value.trim();
        const description = el('problemDesc').value.trim();
        const solutions = collectSolutions(el('solutionEditorsList'));

        if (!title) return showModal("O título do problema é obrigatório.");
        if (solutions.length === 0) return showModal("Adicione pelo menos uma solução.");

        try {
            await addDoc(collection(db, 'users', currentUserId, 'problems'), {
                title,
                description,
                solutions,
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

    el('problemSearch').oninput = () => {
        filterProblems(el('problemSearch').value.trim().toLowerCase());
    };
}

// --- GERENCIAMENTO DE EDITORES DE SOLUÇÃO ---

/**
 * Retorna as soluções preenchidas como array de objetos {label, text}
 */
function collectSolutions(container) {
    const items = container.querySelectorAll('.solution-editor-item');
    const solutions = [];
    items.forEach((item, i) => {
        const label = item.querySelector('.solution-label-input')?.value.trim() || `Solução ${i + 1}`;
        const text = item.querySelector('.rich-editor')?.innerHTML.trim();
        if (text && text !== '<br>') {
            solutions.push({ label, text });
        }
    });
    return solutions;
}

/**
 * Renderiza o container inicial com um editor de solução
 */
function renderSolutionEditors(container, solutions = []) {
    container.innerHTML = '';
    if (solutions.length === 0) {
        addSolutionEditor(container);
    } else {
        solutions.forEach(s => addSolutionEditor(container, s));
    }
}

/**
 * Adiciona um novo editor de solução ao container
 */
function addSolutionEditor(container, solution = null) {
    const index = container.querySelectorAll('.solution-editor-item').length + 1;
    const item = document.createElement('div');
    item.className = 'solution-editor-item';
    item.innerHTML = `
        <div class="solution-editor-header">
            <input class="solution-label-input" type="text" placeholder="Título da solução (ex: Solução ${index})" value="${solution ? escapeAttr(solution.label) : ''}" />
            <button class="btn ghost btn-remove-solution" title="Remover solução">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <div class="rich-editor solution-rich-editor" contenteditable="true" data-placeholder="Digite a solução... Cole imagens aqui">${solution ? sanitizeHtml(solution.text) : ''}</div>
    `;

    setupRichEditor(item.querySelector('.rich-editor'));

    item.querySelector('.btn-remove-solution').onclick = () => {
        const items = container.querySelectorAll('.solution-editor-item');
        if (items.length === 1) return showModal("O problema deve ter pelo menos uma solução.");
        item.remove();
    };

    container.appendChild(item);
}

// --- COMPATIBILIDADE COM DADOS ANTIGOS ---

/**
 * Normaliza um item do Firestore para sempre ter o campo `solutions` como array.
 * Dados antigos tinham `solution: string` — converte automaticamente.
 */
function normalizeSolutions(item) {
    if (item.solutions && Array.isArray(item.solutions)) return item.solutions;
    if (item.solution) return [{ label: 'Solução 1', text: item.solution }];
    return [];
}

// --- CARREGAMENTO E RENDERIZAÇÃO ---

async function loadProblems(userId) {
    const list = el('problemList');
    if (!list) return;

    try {
        const snap = await getDocs(collection(db, 'users', userId, 'problems'));
        list.innerHTML = '';

        allProblems = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        if (allProblems.length === 0) {
            list.innerHTML = '<p class="sub center">Nenhum problema cadastrado.</p>';
            return;
        }

        allProblems.forEach(item => {
            const solutions = normalizeSolutions(item);
            const card = document.createElement('div');
            card.className = 'problem-card card';

            const solutionsHtml = solutions.map((s, i) => `
                <div class="accordion-item">
                    <button class="accordion-trigger" data-index="${i}">
                        <span><i class="fa-solid fa-lightbulb"></i> ${escapeHtml(s.label || `Solução ${i + 1}`)}</span>
                        <i class="fa-solid fa-chevron-down accordion-icon"></i>
                    </button>
                    <div class="accordion-body">
                        <div class="solution-text" data-solution-index="${i}">${sanitizeHtml(s.text)}</div>
                    </div>
                </div>
            `).join('');

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

            // Acordeão
            card.querySelectorAll('.accordion-trigger').forEach(trigger => {
                trigger.onclick = () => {
                    const body = trigger.nextElementSibling;
                    const icon = trigger.querySelector('.accordion-icon');
                    const isOpen = body.classList.contains('open');
                    body.classList.toggle('open', !isOpen);
                    icon.classList.toggle('rotated', !isOpen);
                };
            });

            // Copiar solução ao clicar no texto
            card.querySelectorAll('.solution-text').forEach((el, i) => {
                el.onclick = async () => {
                    const textOnly = solutions[i]?.text.replace(/<[^>]*>/g, '').trim();
                    if (textOnly) {
                        try {
                            await navigator.clipboard.writeText(textOnly);
                            showToast("Solução copiada!");
                        } catch (err) {
                            console.error("Erro ao copiar:", err);
                        }
                    }
                };
            });

            card.querySelector('.btn-edit-problem').onclick = () => enterEditMode(card, item, userId, solutions);
            card.querySelector('.btn-del-problem').onclick = async () => {
                try {
                    await deleteDoc(doc(db, 'users', userId, 'problems', item.id));
                    showToast("Problema excluído!");
                    loadProblems(userId);
                } catch (err) {
                    console.error("Erro ao excluir problema:", err);
                    showModal("Erro ao excluir o problema.");
                }
            };

            list.appendChild(card);
        });

        const searchQuery = el('problemSearch')?.value.trim().toLowerCase();
        if (searchQuery) filterProblems(searchQuery);
    } catch (err) {
        console.error("Erro ao carregar problemas:", err);
    }
}

// --- MODO DE EDIÇÃO ---

function enterEditMode(card, item, userId, solutions) {
    card.innerHTML = `
        <input class="edit-title" type="text" value="${escapeAttr(item.title)}" placeholder="Título do problema..." />
        <textarea class="edit-desc" rows="3" placeholder="Descreva o problema...">${escapeHtml(item.description || '')}</textarea>
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

    card.querySelector('.btn-add-solution-edit').onclick = () => {
        addSolutionEditor(editContainer);
    };

    card.querySelector('.edit-title').focus();

    card.querySelector('.btn-save-edit').onclick = async () => {
        const title = card.querySelector('.edit-title').value.trim();
        const description = card.querySelector('.edit-desc').value.trim();
        const newSolutions = collectSolutions(editContainer);

        if (!title) return showModal("O título do problema é obrigatório.");
        if (newSolutions.length === 0) return showModal("Adicione pelo menos uma solução.");

        try {
            await updateDoc(doc(db, 'users', userId, 'problems', item.id), {
                title, description, solutions: newSolutions,
                // Remove campo legado se existia
                solution: null
            });
            showToast("Problema atualizado!");
            loadProblems(userId);
        } catch (err) {
            console.error("Erro ao atualizar problema:", err);
            showModal("Erro ao atualizar o problema.");
        }
    };

    card.querySelector('.btn-cancel-edit').onclick = () => loadProblems(userId);
}

// --- UTILITÁRIOS ---

function clearProblemForm() {
    el('problemTitle').value = '';
    el('problemDesc').value = '';
    renderSolutionEditors(el('solutionEditorsList'));
}

function filterProblems(query) {
    const list = el('problemList');
    const cards = list.querySelectorAll('.problem-card');

    if (!query) {
        cards.forEach(c => c.style.display = '');
        return;
    }

    cards.forEach((card, i) => {
        const item = allProblems[i];
        if (!item) return;
        const solutions = normalizeSolutions(item);
        const solutionText = solutions.map(s => s.text.replace(/<[^>]*>/g, '')).join(' ');
        const text = `${item.title} ${item.description || ''} ${solutionText}`.toLowerCase();
        card.style.display = text.includes(query) ? '' : 'none';
    });
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

function sanitizeHtml(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const allowed = new Set(['IMG', 'BR', 'P', 'DIV', '#text']);
    function clean(node) {
        [...node.childNodes].forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                if (!allowed.has(child.tagName)) {
                    const text = document.createTextNode(child.textContent);
                    node.replaceChild(text, child);
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
