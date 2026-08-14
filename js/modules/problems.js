import {
    db, el,
    collection,
    query,
    orderBy,
    limit,
    startAfter
} from '../core/firebase.js';
import { getDocs, addDoc } from '../core/firebase-retry.js';

import { showModal } from '../core/modal.js';
import { showToast } from '../core/toast.js';
import { debounce } from '../core/utils.js';

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
import {
    initDepartments, resetDepartments, getActiveDepartmentId,
    refreshDeptCounts, populateDeptSelect, getDepartments, DEPT_COLORS
} from './problems/departments.js';

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
    // Inicializa departamentos (carrega sidebar, cria padrões se não existirem)
    initDepartments(uid, () => {
        _applyFilters();
        _updateDeptDot();
    });
    loadProblems(uid);
}

export function resetProblems() {
    uiInitialized   = false;
    currentUserId    = null;
    activeTagFilter  = null;
    allProblems.length = 0;
    dragSrcProblem   = null;
    _lastProblemDoc  = null;
    resetDepartments();
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
        activeDepartmentId: getActiveDepartmentId(),
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
        // Popular o select de departamento ao abrir o form
        populateDeptSelect(el('problemDepartment'), getActiveDepartmentId());
        _updateDeptDot();
    };

    // Atualiza bolinha de cor ao trocar departamento no select
    el('problemDepartment')?.addEventListener('change', _updateDeptDot);

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

        const department = el('problemDepartment')?.value || null;

        try {
            await addDoc(collection(db, 'users', currentUserId, 'problems'), {
                title, description, solutions, tags,
                department: department || null,
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
    el('btnExportManual').onclick = () => exportKnowledgeBaseManual(allProblems);
    el('btnImportProblems').onclick = () => el('importProblemsInput').click();
    el('importProblemsInput').onchange = (e) => importProblems(e, currentUserId, allProblems, loadProblems);
}

// Atualiza a bolinha colorida ao lado do select de departamento
function _updateDeptDot() {
    const select = el('problemDepartment');
    const dot    = el('problemDeptDot');
    if (!select || !dot) return;
    const deptId = select.value;
    if (!deptId) { dot.style.backgroundColor = '#6b7280'; return; }
    const dept = getDepartments().find(d => d.id === deptId);
    if (!dept) { dot.style.backgroundColor = '#6b7280'; return; }
    const color = DEPT_COLORS.find(c => c.id === dept.color);
    dot.style.backgroundColor = color?.hex || '#6b7280';
}

export function exportKnowledgeBaseManual(problems) {
    if (!problems || problems.length === 0) {
        return showModal("Não há problemas cadastrados na Base de Conhecimento para gerar o manual.");
    }

    const printWin = window.open('', '_blank');
    if (!printWin) return showModal("Não foi possível abrir a janela de impressão. Permita pop-ups.");

    const rowsHtml = problems.map((item, index) => {
        const solutions = normalizeSolutions(item);
        const tagsHtml = (Array.isArray(item.tags) && item.tags.length > 0)
            ? `<div class="manual-tags">${item.tags.map(t => `<span class="manual-tag">#${t}</span>`).join(' ')}</div>`
            : '';

        const solutionsHtml = solutions.map((sol, sIndex) => {
            const statusBadge = sol.status === 'confirmed' ? '✅ Confirmada' : sol.status === 'testing' ? '🧪 Em teste' : '❌ Obsoleta';
            return `
                <div class="manual-solution">
                    <h4>${sol.label || `Solução ${sIndex + 1}`} <span class="manual-status">${statusBadge}</span></h4>
                    <div class="manual-solution-body">${sol.text || ''}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="manual-item">
                <div class="manual-item-header">
                    <span class="manual-num">#${index + 1}</span>
                    <h3 class="manual-title">${item.title}</h3>
                </div>
                ${item.description ? `<p class="manual-desc">${item.description}</p>` : ''}
                ${tagsHtml}
                ${solutionsHtml}
            </div>
        `;
    }).join('');

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Manual da Base de Conhecimento — PainelAtende</title>
            <style>
                body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; padding: 40px; max-width: 900px; margin: 0 auto; }
                h1 { color: #0f172a; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 8px; font-size: 26px; }
                .manual-meta { font-size: 13px; color: #64748b; margin-bottom: 32px; }
                .manual-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; page-break-inside: avoid; }
                .manual-item-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
                .manual-num { font-size: 14px; font-weight: 700; color: #2563eb; background: #dbeafe; padding: 2px 8px; border-radius: 6px; }
                .manual-title { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0; }
                .manual-desc { font-size: 14px; color: #475569; margin: 6px 0 12px; }
                .manual-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
                .manual-tag { font-size: 11px; background: #e2e8f0; color: #334155; padding: 2px 8px; border-radius: 12px; font-weight: 600; }
                .manual-solution { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin-top: 10px; }
                .manual-solution h4 { font-size: 14px; font-weight: 600; margin: 0 0 8px; display: flex; justify-content: space-between; }
                .manual-status { font-size: 12px; font-weight: 500; }
                .manual-solution-body { font-size: 13px; color: #334155; }
                .manual-solution-body img { max-width: 100%; border-radius: 6px; }
                @media print {
                    body { padding: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="no-print" style="margin-bottom: 20px; text-align: right;">
                <button onclick="window.print()" style="background:#2563eb;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer;">🖨️ Imprimir / Salvar em PDF</button>
            </div>
            <h1>Manual da Base de Conhecimento</h1>
            <p class="manual-meta">Gerado automaticamente pelo PainelAtende em ${new Date().toLocaleDateString('pt-BR')} — Total de ${problems.length} problema(s) cadastrado(s).</p>
            ${rowsHtml}
        </body>
        </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
    showToast("Manual gerado com sucesso!");
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

        if (snap.empty && append) {
            showToast("Não há mais problemas.");
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

        // Atualiza contadores por departamento na sidebar
        refreshDeptCounts(allProblems);
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
    // Reset department select
    const deptSel = el('problemDepartment');
    if (deptSel) deptSel.value = '';
    const dot = el('problemDeptDot');
    if (dot) dot.style.backgroundColor = '#6b7280';
}
