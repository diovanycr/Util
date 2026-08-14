import {
    el, db,
    collection, doc
} from '../../core/firebase.js';
import { writeBatch } from '../../core/firebase-retry.js';

import { showModal, openConfirmModal } from '../../core/modal.js';
import { showToast } from '../../core/toast.js';
import { allProblems } from '../problems.js';

/**
 * Importa problemas de um arquivo JSON.
 * Deduplica por título (ignora itens cujo título já existe em allProblems).
 *
 * @param {Event}   e         Evento do input file
 * @param {string}  userId    UID do usuário atual
 * @param {Array}   allProblems Array de problemas já carregados (para dedup)
 * @param {Function} loadProblemsCallback Recarrega a lista após importar
 */
export async function importProblems(e, userId, allProblems, loadProblemsCallback) {
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
                loadProblemsCallback(userId);
            } catch (err) {
                console.error(err);
                showModal('Erro ao importar problemas.');
            }
        },
        null,
        `Importar ${data.length} problema(s) do arquivo "${file.name}"? Itens duplicados (mesmo título) serão ignorados.`
    );
}

/**
 * Exporta allProblems como arquivo JSON.
 * @param {Array} allProblems Lista de problemas a exportar
 */
export function exportProblems(allProblems) {
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

/**
 * Persiste a ordem dos cards de problema no Firestore.
 * @param {string} userId UID do usuário
 */
export async function saveProblemOrder(userId) {
    const list = el('problemList');
    if (!list) return;
    const cards = [...list.querySelectorAll('.problem-card')];
    try {
        const batch = writeBatch(db);
        let changed = 0;
        cards.forEach((card, i) => {
            const id = card.dataset.id;
            const newOrd = i + 1;
            const existing = allProblems.find(p => p.id === id);
            if (existing && existing.order !== newOrd) {
                batch.update(doc(db, 'users', userId, 'problems', id), { order: newOrd });
                changed++;
            }
        });
        if (changed > 0) await batch.commit();
    } catch (err) { console.error("Erro ao salvar ordem:", err); }
}
