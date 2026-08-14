/**
 * departments.js — Sistema de pastas/departamentos para a Base de Conhecimento
 *
 * Funcionalidades:
 * - CRUD de departamentos no Firestore (users/{uid}/departments)
 * - Sidebar visual com filtro ativo
 * - Departamentos padrão criados na primeira vez
 * - Paleta de 8 cores customizáveis
 */

import { db, el, collection, doc, query, orderBy } from '../firebase.js';
import { getDocs, addDoc, updateDoc, deleteDoc } from '../firebase-retry.js';
import { showModal, openConfirmModal } from '../modal.js';
import { showToast } from '../toast.js';
import { escapeHtml } from '../utils.js';

// ── Constantes ─────────────────────────────────────────────────────────────

export const DEPT_COLORS = [
    { id: 'dept-blue',   label: 'Azul',    hex: '#3b82f6' },
    { id: 'dept-green',  label: 'Verde',   hex: '#22c55e' },
    { id: 'dept-purple', label: 'Roxo',    hex: '#a855f7' },
    { id: 'dept-orange', label: 'Laranja', hex: '#f97316' },
    { id: 'dept-red',    label: 'Vermelho',hex: '#ef4444' },
    { id: 'dept-cyan',   label: 'Ciano',   hex: '#06b6d4' },
    { id: 'dept-pink',   label: 'Rosa',    hex: '#ec4899' },
    { id: 'dept-gray',   label: 'Cinza',   hex: '#6b7280' },
];

const DEFAULT_DEPARTMENTS = [
    { name: 'N1 Suporte',   color: 'dept-blue',   order: 0 },
    { name: 'N2 Técnico',   color: 'dept-purple',  order: 1 },
    { name: 'Financeiro',   color: 'dept-green',   order: 2 },
    { name: 'RH',           color: 'dept-orange',  order: 3 },
    { name: 'Geral',        color: 'dept-gray',    order: 4 },
];

// ── Estado ─────────────────────────────────────────────────────────────────

let _departments   = [];       // { id, name, color, order }
let _activeDeptId  = null;     // null = "Todos"
let _currentUserId = null;
let _onFilterChange = null;    // callback chamado ao mudar filtro

// ── API pública ────────────────────────────────────────────────────────────

export function getActiveDepartmentId() { return _activeDeptId; }
export function getDepartments() { return _departments; }

/**
 * Inicializa o módulo.
 * @param {string}   uid            ID do usuário logado
 * @param {Function} onFilterChange Callback chamado ao trocar departamento ativo
 */
export async function initDepartments(uid, onFilterChange) {
    _currentUserId  = uid;
    _onFilterChange = onFilterChange;
    _activeDeptId   = null;

    await _loadDepartments();

    const btn = el('btnNewDepartment');
    if (btn) btn.onclick = () => _openDeptModal(null);
}

export function resetDepartments() {
    _departments   = [];
    _activeDeptId  = null;
    _currentUserId = null;
    _onFilterChange = null;
    const sidebar = el('departmentSidebar');
    if (sidebar) sidebar.innerHTML = '';
}

// ── Carregamento e inicialização ───────────────────────────────────────────

async function _loadDepartments() {
    if (!_currentUserId) return;

    try {
        const q    = query(collection(db, 'users', _currentUserId, 'departments'), orderBy('order'));
        const snap = await getDocs(q);

        if (snap.empty) {
            await _createDefaultDepartments();
            return; // após criar, _createDefaultDepartments chama _loadDepartments novamente
        }

        _departments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        _renderSidebar();
    } catch (err) {
        console.error('Erro ao carregar departamentos:', err);
    }
}

async function _createDefaultDepartments() {
    try {
        const col = collection(db, 'users', _currentUserId, 'departments');
        for (const dept of DEFAULT_DEPARTMENTS) {
            await addDoc(col, dept);
        }
        await _loadDepartments();
    } catch (err) {
        console.error('Erro ao criar departamentos padrão:', err);
    }
}

// ── Renderização da sidebar ────────────────────────────────────────────────

function _renderSidebar() {
    const sidebar = el('departmentSidebar');
    if (!sidebar) return;

    // Limpa itens antigos, mantém o header
    const header = sidebar.querySelector('.dept-sidebar-header');
    sidebar.innerHTML = '';
    if (header) sidebar.appendChild(header);

    // Item "Todos"
    sidebar.appendChild(_buildDeptItem(null, 'Todos', 'dept-gray', _departments.length));

    // Um item por departamento
    for (const dept of _departments) {
        const count = _countForDept(dept.id);
        sidebar.appendChild(_buildDeptItem(dept.id, dept.name, dept.color, count, dept));
    }
}

function _countForDept(deptId) {
    // Importado via callback para evitar circular — o count real vem do allProblems exposto
    // Aqui retornamos 0; o caller pode chamar refreshDeptCounts() após carregar problemas
    return 0;
}

/**
 * Atualiza os contadores dos departamentos com base nos problemas carregados.
 * @param {Array} allProblems
 */
export function refreshDeptCounts(allProblems) {
    const sidebar = el('departmentSidebar');
    if (!sidebar) return;

    // "Todos"
    const allItem = sidebar.querySelector('[data-dept-id="__all__"]');
    if (allItem) {
        const badge = allItem.querySelector('.dept-item-count');
        if (badge) badge.textContent = allProblems.length;
    }

    // Por departamento
    for (const dept of _departments) {
        const count = allProblems.filter(p => p.department === dept.id).length;
        const item  = sidebar.querySelector(`[data-dept-id="${dept.id}"]`);
        if (item) {
            const badge = item.querySelector('.dept-item-count');
            if (badge) badge.textContent = count;
        }
    }
}

function _buildDeptItem(deptId, name, color, count, deptData = null) {
    const isAll    = deptId === null;
    const isActive = _activeDeptId === deptId;
    const dataId   = isAll ? '__all__' : deptId;

    const btn = document.createElement('button');
    btn.className = `dept-item${isActive ? ' active' : ''}`;
    btn.dataset.deptId = dataId;
    btn.title = name;

    const colorHex = DEPT_COLORS.find(c => c.id === color)?.hex || '#6b7280';

    btn.innerHTML = `
        <span class="dept-color-dot" style="background-color:${escapeHtml(colorHex)}"></span>
        <span class="dept-item-label">${escapeHtml(name)}</span>
        <span class="dept-item-count">${count}</span>
        ${!isAll ? `
        <span class="dept-item-actions">
            <button class="btn-edit-dept" title="Renomear" aria-label="Editar departamento ${escapeHtml(name)}">
                <i class="fa-solid fa-pen" aria-hidden="true"></i>
            </button>
            <button class="btn-delete-dept" title="Excluir" aria-label="Excluir departamento ${escapeHtml(name)}">
                <i class="fa-solid fa-trash" aria-hidden="true"></i>
            </button>
        </span>` : ''}
    `;

    // Clicar seleciona o departamento
    btn.addEventListener('click', (e) => {
        if (e.target.closest('.dept-item-actions')) return; // evita ativar ao clicar nos botões
        _setActive(deptId);
    });

    if (!isAll && deptData) {
        btn.querySelector('.btn-edit-dept')?.addEventListener('click', (e) => {
            e.stopPropagation();
            _openDeptModal(deptData);
        });
        btn.querySelector('.btn-delete-dept')?.addEventListener('click', (e) => {
            e.stopPropagation();
            _confirmDeleteDept(deptData);
        });
    }

    return btn;
}

function _setActive(deptId) {
    _activeDeptId = deptId;

    // Atualiza classes ativas
    const sidebar = el('departmentSidebar');
    sidebar?.querySelectorAll('.dept-item').forEach(item => {
        const itemId = item.dataset.deptId;
        const active = (deptId === null && itemId === '__all__') || itemId === deptId;
        item.classList.toggle('active', active);
    });

    // Dispara o filtro
    if (_onFilterChange) _onFilterChange();
}

// ── Modal de criação / edição ──────────────────────────────────────────────

function _openDeptModal(existing) {
    const isEdit = !!existing;
    const title  = isEdit ? 'Editar Departamento' : 'Novo Departamento';
    const defaultColor = existing?.color || 'dept-blue';

    // Gera HTML do color picker
    const colorOptions = DEPT_COLORS.map(c => `
        <button type="button"
            class="dept-color-option${c.id === defaultColor ? ' selected' : ''}"
            data-color="${c.id}"
            style="background-color:${c.hex}"
            title="${c.label}"
            aria-label="Cor ${c.label}"
            aria-pressed="${c.id === defaultColor}">
        </button>
    `).join('');

    const modalEl = el('deptModal');
    if (!modalEl) return;

    el('deptModalTitle').textContent = title;
    el('deptNameInput').value = existing?.name || '';
    el('deptColorPicker').innerHTML = colorOptions;

    // Marca cor selecionada
    let selectedColor = defaultColor;

    el('deptColorPicker').querySelectorAll('.dept-color-option').forEach(opt => {
        opt.addEventListener('click', () => {
            el('deptColorPicker').querySelectorAll('.dept-color-option').forEach(o => {
                o.classList.remove('selected');
                o.setAttribute('aria-pressed', 'false');
            });
            opt.classList.add('selected');
            opt.setAttribute('aria-pressed', 'true');
            selectedColor = opt.dataset.color;
        });
    });

    modalEl.classList.remove('hidden');
    modalEl.style.display = 'flex';
    el('deptNameInput').focus();

    // Botão salvar
    el('btnSaveDept').onclick = async () => {
        const name = el('deptNameInput').value.trim();
        if (!name) return showModal('O nome do departamento é obrigatório.');

        try {
            if (isEdit) {
                await updateDoc(doc(db, 'users', _currentUserId, 'departments', existing.id), { name, color: selectedColor });
                showToast('Departamento atualizado!');
            } else {
                const maxOrder = _departments.reduce((m, d) => Math.max(m, d.order ?? 0), 0);
                await addDoc(collection(db, 'users', _currentUserId, 'departments'), {
                    name, color: selectedColor, order: maxOrder + 1
                });
                showToast('Departamento criado!');
            }
            _closeDeptModal();
            await _loadDepartments();
        } catch (err) {
            console.error('Erro ao salvar departamento:', err);
            showModal('Erro ao salvar o departamento.');
        }
    };

    el('btnCancelDept').onclick = _closeDeptModal;
    modalEl.addEventListener('click', (e) => { if (e.target === modalEl) _closeDeptModal(); }, { once: true });
}

function _closeDeptModal() {
    const modalEl = el('deptModal');
    if (!modalEl) return;
    modalEl.classList.add('hidden');
    modalEl.style.display = 'none';
}

function _confirmDeleteDept(dept) {
    openConfirmModal(
        async () => {
            try {
                await deleteDoc(doc(db, 'users', _currentUserId, 'departments', dept.id));
                // Se era o ativo, volta para "Todos"
                if (_activeDeptId === dept.id) _setActive(null);
                showToast('Departamento excluído!');
                await _loadDepartments();
            } catch (err) {
                showModal('Erro ao excluir o departamento.');
            }
        },
        null,
        `Excluir o departamento "${dept.name}"? Os problemas vinculados não serão excluídos.`
    );
}

/**
 * Preenche um <select> com os departamentos disponíveis.
 * @param {HTMLSelectElement} selectEl
 * @param {string|null} currentDeptId Departamento atualmente selecionado
 */
export function populateDeptSelect(selectEl, currentDeptId = null) {
    if (!selectEl) return;
    selectEl.innerHTML = '<option value="">— Sem departamento —</option>';
    for (const dept of _departments) {
        const opt = document.createElement('option');
        opt.value = dept.id;
        opt.textContent = dept.name;
        if (dept.id === currentDeptId) opt.selected = true;
        selectEl.appendChild(opt);
    }
}
