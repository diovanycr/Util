import {
    el, db, doc, collection
} from '../../core/firebase.js';
import { deleteDoc, addDoc } from '../../core/firebase-retry.js';

import { showModal, openConfirmModal } from '../../core/modal.js';
import { showToast } from '../../core/toast.js';
import {
    escapeHtml, escapeAttr, sanitizeHtml,
    normalizeSolutions, getTagColor, addKeyboardDragSupport, setupDragDrop
} from '../../core/utils.js';
export { normalizeSolutions };

import { normalizeTags } from './tags.js';

export const STATUS_LABELS = {
    confirmed: { label: 'Confirmada', icon: 'fa-circle-check',  cls: 'status-confirmed' },
    testing:   { label: 'Em teste',    icon: 'fa-flask',         cls: 'status-testing'   },
    obsolete:  { label: 'Obsoleta',    icon: 'fa-circle-xmark', cls: 'status-obsolete'  }
};

/**
 * Constrói o HTML interno de um card de problema.
 * @param {Object} item    Documento do Firestore com { id, title, ... }
 * @param {Array}  solutions Lista de soluções já normalizadas
 * @param {Array}  tags      Lista de tags já normalizadas
 * @returns {string} HTML do card
 */
function buildCardHtml(item, solutions, tags) {
    const safeItemId = String(item.id || Math.random().toString(36).substring(2, 9)).replace(/[^a-zA-Z0-9_-]/g, '_');
    const hasSolutions = Array.isArray(solutions) && solutions.length > 0 && solutions.some(s => s && (s.text || '').replace(/<[^>]*>/g, '').trim().length > 0);

    const noSolutionBadge = !hasSolutions
        ? `<span class="no-solution-badge" title="Este problema ainda não possui solução cadastrada"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Sem solução</span>`
        : '';

    const noSolutionWarning = !hasSolutions
        ? `<div class="no-solution-warning"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> Nenhuma solução cadastrada para este problema ainda. Clique no ícone de lápis para adicionar.</div>`
        : '';

    const solutionsHtml = solutions.map((s, i) => {
        const st = STATUS_LABELS[s.status] || STATUS_LABELS.confirmed;
        const accordionId = `problem-${safeItemId}-sol-${i}`;
        const triggerId = `problem-${safeItemId}-trig-${i}`;
        return `
            <div class="accordion-item">
                <button id="${triggerId}" class="accordion-trigger" data-index="${i}" aria-expanded="false" aria-controls="${accordionId}">
                    <span>
                        <i class="fa-solid fa-lightbulb" aria-hidden="true"></i>
                        ${escapeHtml(s.label || `Solução ${i + 1}`)}
                        <span class="solution-status-badge ${st.cls}">
                            <i class="fa-solid ${st.icon}" aria-hidden="true"></i> ${st.label}
                        </span>
                    </span>
                    <i class="fa-solid fa-chevron-down accordion-icon" aria-hidden="true"></i>
                </button>
                <div id="${accordionId}" class="accordion-body" role="region" aria-labelledby="${triggerId}">
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

    return `
        <div class="problem-header">
            <h3 class="problem-title">${escapeHtml(item.title)}${noSolutionBadge}</h3>
            <div class="problem-actions">
                <button class="btn ghost problem-drag-handle" title="Reordenar problema"><i class="fa-solid fa-grip-lines" aria-hidden="true"></i></button>
                <button class="btn ghost btn-duplicate-problem" title="Duplicar problema" aria-label="Duplicar problema"><i class="fa-solid fa-clone" aria-hidden="true"></i></button>
                <button class="btn ghost btn-edit-problem" aria-label="Editar problema"><i class="fa-solid fa-pen" aria-hidden="true"></i></button>
                <button class="btn ghost btn-del-problem" aria-label="Excluir problema"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>
            </div>
        </div>
        ${item.description ? `<p class="problem-desc">${escapeHtml(item.description)}</p>` : ''}
        ${tagsHtml}
        ${hasSolutions ? `<div class="accordion">${solutionsHtml}</div>` : noSolutionWarning}
    `;
}

/**
 * Vincula todos os event listeners de um card já no DOM.
 */
function bindCardEvents(card, item, solutions, ctx) {
    // Accordion toggle
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

    // Copy fields
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

    // Duplicate
    const btnDup = card.querySelector('.btn-duplicate-problem');
    if (btnDup) {
        btnDup.onclick = async () => {
            try {
                const maxOrder = (ctx.allProblems || []).reduce((max, p) => Math.max(max, p.order || 0), 0);
                const dupTitle = `${item.title} (Cópia)`;
                await addDoc(collection(db, 'users', ctx.currentUserId, 'problems'), {
                    title: dupTitle,
                    description: item.description || '',
                    department: item.department || '',
                    tags: normalizeTags(item),
                    solutions: solutions,
                    order: maxOrder + 1,
                    createdAt: Date.now()
                });
                showToast("Problema duplicado!");
                ctx.loadProblems(ctx.currentUserId);
            } catch (err) {
                console.error("Erro ao duplicar problema:", err);
                showModal("Erro ao duplicar o problema.");
            }
        };
    }

    // Edit
    card.querySelector('.btn-edit-problem').onclick = () =>
        ctx.enterEditMode(card, item, ctx.currentUserId, solutions, normalizeTags(item));

    // Delete
    card.querySelector('.btn-del-problem').onclick = () => {
        openConfirmModal(
            async () => {
                try {
                    await deleteDoc(doc(db, 'users', ctx.currentUserId, 'problems', item.id));
                    showToast("Problema excluído!");
                    ctx.loadProblems(ctx.currentUserId);
                } catch (err) { showModal("Erro ao excluir o problema."); }
            },
            null,
            `Deseja realmente excluir o problema "${item.title}"? Esta ação não poderá ser desfeita.`
        );
    };

    // Drag-and-drop (mouse + teclado) — helper compartilhado
    setupDragDrop(
        card,
        card.querySelector('.problem-drag-handle'),
        el('problemList'),
        () => [...el('problemList').querySelectorAll('.problem-card')],
        () => ctx.saveProblemOrder(ctx.currentUserId)
    );

    // Atualiza dragSrc via ctx para compat com listeners externos
    card.addEventListener('dragstart', () => ctx.setDragSrc(card));
}

/**
 * Renderiza um único card de problema e anexa à lista.
 * @param {Object}   item   Documento do problema
 * @param {HTMLElement} list Container (.problem-list)
 * @param {Object}   ctx    Contexto { currentUserId, enterEditMode, saveProblemOrder,
 *                          setDragSrc, getDragSrc, loadProblems }
 */
export function renderProblemCard(item, list, ctx) {
    const solutions = normalizeSolutions(item);
    const tags      = normalizeTags(item);
    const card      = document.createElement('div');
    card.className  = 'problem-card card';
    card.draggable  = true;
    card.dataset.id = item.id;

    card.innerHTML = buildCardHtml(item, solutions, tags);
    bindCardEvents(card, item, solutions, { ...ctx, getTagColor });

    list.appendChild(card);
}

/**
 * Renderiza todos (ou um subconjunto filtrado) de problemas na lista.
 * @param {Array|undefined} problems Lista de problemas a renderizar (undefined = allProblems)
 * @param {Object} ctx              Contexto { currentUserId, enterEditMode,
 *                                  saveProblemOrder, setDragSrc, getDragSrc,
 *                                  loadProblems, allProblems }
 */
export function renderProblems(problems, ctx) {
    const list = el('problemList');
    list.innerHTML = '';

    const items = problems ?? ctx.allProblems;

    if (!items || items.length === 0) {
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

    items.forEach(item => renderProblemCard(item, list, ctx));

    // Dispara evento para adicionar estrelas de favoritos
    document.dispatchEvent(new Event('itemsRendered'));
}

/**
 * Atualiza a barra de chips de filtro por tag.
 * @param {Object} ctx { allProblems, activeTagFilter, setActiveTagFilter }
 */
export function updateTagFilterBar(ctx) {
    const bar = el('tagFilterBar');
    if (!bar) return;

    const allTags = [...new Set(ctx.allProblems.flatMap(p => normalizeTags(p)))].sort();

    if (allTags.length === 0) {
        bar.classList.add('hidden');
        return;
    }

    bar.classList.remove('hidden');
    bar.innerHTML = '<span class="tag-filter-label">Filtrar:</span>';

    const allChip = document.createElement('button');
    allChip.className = `tag-filter-chip ${!ctx.activeTagFilter ? 'active' : ''}`;
    allChip.textContent = 'Todas';
    allChip.setAttribute('aria-pressed', !ctx.activeTagFilter ? 'true' : 'false');
    allChip.onclick = () => { ctx.setActiveTagFilter(null); updateTagFilterBar(ctx); ctx.applyFilters(); };
    bar.appendChild(allChip);

    allTags.forEach(tag => {
        const chip = document.createElement('button');
        chip.className = `tag-filter-chip ${getTagColor(tag)} ${ctx.activeTagFilter === tag ? 'active' : ''}`;
        chip.textContent = tag;
        chip.setAttribute('aria-pressed', ctx.activeTagFilter === tag ? 'true' : 'false');
        chip.onclick = () => {
            ctx.setActiveTagFilter(ctx.activeTagFilter === tag ? null : tag);
            updateTagFilterBar(ctx);
            ctx.applyFilters();
        };
        bar.appendChild(chip);
    });
}

export function applyFilters(ctx) {
    const queryVal = el('problemSearch')?.value.trim().toLowerCase() || '';
    const statusVal = ctx.activeStatusFilter || el('problemStatusFilter')?.value || '';

    const filtered = ctx.allProblems.filter(item => {
        const solutions  = normalizeSolutions(item);
        const solText    = solutions.map(s => s.text.replace(/<[^>]*>/g, '')).join(' ');
        const tags       = normalizeTags(item);
        const matchText  = !queryVal || `${item.title} ${item.description || ''} ${solText} ${tags.join(' ')}`.toLowerCase().includes(queryVal);
        const matchTag   = !ctx.activeTagFilter || tags.includes(ctx.activeTagFilter);
        const matchDept  = !ctx.activeDepartmentId || item.department === ctx.activeDepartmentId;
        const matchStatus = !statusVal || solutions.some(s => (s.status || 'confirmed') === statusVal);
        return matchText && matchTag && matchDept && matchStatus;
    });

    ctx.renderFiltered(filtered);
}

