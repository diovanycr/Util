import {
    db, el,
    collection,
    query,
    orderBy,
    limit,
    startAfter
} from './firebase.js';
import { getDocs, addDoc } from './firebase-retry.js';

import { showModal } from './modal.js';
import { showToast } from './toast.js';
import { debounce } from './utils.js';

import { setupTagInput, getTagsFromPills, normalizeTags } from './problems/tags.js';
import {
    setupRichEditor, addCopyTextField, addSolutionEditor,
    renderSolutionEditors, collectSolutions
} from './problems/solution-editor.js';
import {
    renderProblemCard, renderProblems, updateTagFilterBar, applyFilters
} from './problems/problem-render.js';
import { enterEditMode } from './problems/problem-edit.js';
import {
    importProblems, exportProblems, saveProblemOrder
} from './problems/problem-io.js';

let currentUserId    = null;
export let allProblems = [];
let uiInitialized     = false;
let dragSrcProblem    = null;
let activeTagFilter   = null;
let _lastProblemDoc   = null;
const PROBLEM_PAGE_SIZE = 50;

export function initProblems(uid) {
    currentUserId = uid;
    if (!uiInitialized) {
        setupProblemInterface();
        uiInitialized = true;
    }
    loadProblems(uid);
}

export function resetProblems() {
    uiInitialized   = false;
    currentUserId    = null;
    activeTagFilter  = null;
    allProblems.length = 0;
    dragSrcProblem   = null;
    _lastProblemDoc  = null;
}

// --- BUILD CONTEXT (DI) ---

// Wrapper que fecha a dependência circular com problem-edit.js
function _enterEditMode(card, item, userId, solutions, tags) {
    enterEditMode(card, item, userId, solutions, tags, loadProblems);
}

function buildCtx() {
    return {
        currentUserId,
        allProblems,
        activeTagFilter,
        getDragSrc:        () => dragSrcProblem,
        setDragSrc:        (card) => { dragSrcProblem = card; },
        setActiveTagFilter: (val) => { activeTagFilter = val; },
        enterEditMode:     _enterEditMode,
        saveProblemOrder,
        loadProblems,
        applyFilters:      () => _applyFilters(),
        renderFiltered:     (filtered) => renderProblems(filtered, buildCtx())
    };
}

function _applyFilters() {
    applyFilters(buildCtx());
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

    el('problemSearch').oninput = debounce(() => _applyFilters(), 200);
    el('btnExportProblems').onclick = () => exportProblems(allProblems);
    el('btnImportProblems').onclick = () => el('importProblemsInput').click();
    el('importProblemsInput').onchange = (e) => importProblems(e, currentUserId, allProblems, loadProblems);
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
            updateTagFilterBar(buildCtx());
            _applyFilters();
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
            const ctx = buildCtx();
            newProblems.forEach(p => renderProblemCard(p, list, ctx));
            _applyFilters();
        } else {
            renderProblems(undefined, buildCtx());
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
