/**
 * js/core/undoService.js
 *
 * Serviço centralizado para exclusão recuperável (soft-delete) com toast de desfazer.
 */

import { showToast } from './toast.js';

/** @type {Map<string, any>} */
const activeUndos = new Map();

/**
 * Agenda a exclusão recuperável de um item.
 *
 * @param {string} id
 * @param {any} options
 */
export function scheduleUndoDelete(id, options) {
    const message = options.message;
    const onConfirm = options.onConfirm;
    const onUndo = options.onUndo;
    const durationMs = options.durationMs || 8000;

    if (activeUndos.has(id)) {
        confirmDelete(id);
    }

    const timerId = setTimeout(() => {
        confirmDelete(id);
    }, durationMs);

    activeUndos.set(id, {
        timerId,
        onConfirm,
        onUndo
    });

    showToast(message, 'info', {
        actionText: 'Desfazer',
        onAction: () => {
            undoDelete(id);
        },
        duration: durationMs
    });
}

/**
 * Confirma imediatamente a exclusão e dispara a função remota.
 *
 * @param {string} id
 */
export function confirmDelete(id) {
    const item = activeUndos.get(id);
    if (!item) return;

    clearTimeout(item.timerId);
    activeUndos.delete(id);

    try {
        if (typeof item.onConfirm === 'function') {
            item.onConfirm();
        }
    } catch (err) {
        console.error(`[undoService] Erro ao confirmar exclusão para ID ${id}:`, err);
    }
}

/**
 * Cancela a exclusão e restaura o item na interface.
 *
 * @param {string} id
 */
export function undoDelete(id) {
    const item = activeUndos.get(id);
    if (!item) return;

    clearTimeout(item.timerId);
    activeUndos.delete(id);

    try {
        if (typeof item.onUndo === 'function') {
            item.onUndo();
        }
    } catch (err) {
        console.error(`[undoService] Erro ao restaurar item para ID ${id}:`, err);
    }
}

/**
 * Cancela e confirma todos os temporizadores pendentes.
 */
export function flushAllPendingDeletes() {
    const ids = Array.from(activeUndos.keys());
    for (const id of ids) {
        confirmDelete(id);
    }
}
