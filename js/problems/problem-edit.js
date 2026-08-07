import {
    db, doc
} from '../firebase.js';
import { updateDoc } from '../firebase-retry.js';

import { showModal } from '../modal.js';
import { showToast } from '../toast.js';
import { escapeHtml, escapeAttr } from '../utils.js';

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

    card.querySelector('.btn-add-solution-edit').onclick = () => addSolutionEditor(editContainer);
    card.querySelector('.edit-title').focus();

    card.querySelector('.btn-save-edit').onclick = async () => {
        const title        = card.querySelector('.edit-title').value.trim();
        const description = card.querySelector('.edit-desc').value.trim();
        const newTags      = getTagsFromPills(pillsEl);
        const newSolutions = collectSolutions(editContainer);

        if (!title) return showModal("O título do problema é obrigatório.");
        if (newSolutions.length === 0) return showModal("Adicione pelo menos uma solução.");

        const saveBtn   = card.querySelector('.btn-save-edit');
        const cancelBtn = card.querySelector('.btn-cancel-edit');
        const originalSaveText = saveBtn.innerHTML;
        saveBtn.disabled   = true;
        cancelBtn.disabled  = true;
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
            cancelBtn.disabled  = false;
            saveBtn.innerHTML   = originalSaveText;
        }
    };

    card.querySelector('.btn-cancel-edit').onclick = () => loadProblemsCallback(userId);
}
