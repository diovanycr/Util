import {
    db, doc
} from '../../core/firebase.js';
import { updateDoc } from '../../core/firebase-retry.js';

import { showModal } from '../../core/modal.js';
import { showToast } from '../../core/toast.js';
import { escapeHtml, escapeAttr } from '../../core/utils.js';

import { setupTagInput, getTagsFromPills, renderTagPills } from './tags.js';
import {
    collectSolutions, renderSolutionEditors, addSolutionEditor
} from './solution-editor.js';

/**
 * Entra no modo de edição inline de um card de problema.
 *
 * @param {HTMLElement} card      O card a ser substituído pelo formulário de edição
 * @param {Object}      item      Documento do Firestore
 * @param {string}      userId    UID do usuário atual
 * @param {Array}       solutions Soluções já normalizadas
 * @param {Array}       tags      Tags já normalizadas
 * @param {Function}    loadProblemsCallback Recarrega a lista após salvar/cancelar
 */
export function enterEditMode(card, item, userId, solutions, tags, loadProblemsCallback) {
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

    const pillsEl       = card.querySelector('.edit-tag-pills');
    const tagInput      = card.querySelector('.edit-tag-input');
    const editContainer = card.querySelector('.edit-solutions-list');

    renderTagPills(pillsEl, tags, true);
    setupTagInput(tagInput, pillsEl);
    renderSolutionEditors(editContainer, solutions);

    const addBtn = /** @type {HTMLElement|null} */ (card.querySelector('.btn-add-solution-edit'));
    if (addBtn) addBtn.onclick = () => addSolutionEditor(editContainer);

    const titleInput = /** @type {HTMLInputElement|null} */ (card.querySelector('.edit-title'));
    if (titleInput) titleInput.focus();

    const saveBtn   = /** @type {HTMLButtonElement|null} */ (card.querySelector('.btn-save-edit'));
    const cancelBtn = /** @type {HTMLButtonElement|null} */ (card.querySelector('.btn-cancel-edit'));

    if (saveBtn) {
        saveBtn.onclick = async () => {
            const descInput = /** @type {HTMLTextAreaElement|null} */ (card.querySelector('.edit-desc'));
            const title        = titleInput?.value.trim() || '';
            const description = descInput?.value.trim() || '';
            const newTags      = getTagsFromPills(pillsEl);
            const newSolutions = collectSolutions(editContainer);

            if (!title) return showModal("O título do problema é obrigatório.");
            if (newSolutions.length === 0) return showModal("Adicione pelo menos uma solução.");

            const originalSaveText = saveBtn.innerHTML;
            saveBtn.disabled   = true;
            if (cancelBtn) cancelBtn.disabled = true;
            saveBtn.innerHTML   = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Salvando...';

            try {
                await updateDoc(doc(db, 'users', userId, 'problems', item.id), {
                    title, description, tags: newTags, solutions: newSolutions,
                    solution: null, category: null
                });
                showToast("Problema atualizado!");
                loadProblemsCallback(userId);
            } catch (err) {
                showModal("Erro ao atualizar o problema.");
                saveBtn.disabled   = false;
                if (cancelBtn) cancelBtn.disabled = false;
                saveBtn.innerHTML   = originalSaveText;
            }
        };
    }

    if (cancelBtn) cancelBtn.onclick = () => loadProblemsCallback(userId);
}
