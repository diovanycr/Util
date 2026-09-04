/**
 * firebase-retry.js — Wrapper com retry automático para chamadas do Firebase
 *
 * Uso: importe getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc, writeBatch
 * deste módulo em vez de firebase.js para obter retry automático em erros de rede.
 */

import {
    getDocs as _getDocs,
    getDoc as _getDoc,
    addDoc as _addDoc,
    setDoc as _setDoc,
    updateDoc as _updateDoc,
    deleteDoc as _deleteDoc,
    writeBatch as _writeBatch
} from './firebase.js';
import { announceLoading, announceComplete } from './announce.js';
import { executeWithRetry } from './retry.js';

let activeRequests = 0;

/**
 * Exibe feedback visual global de carregamento e tentativa de reconexão.
 * @param {number} [attempt=1]
 */
function showGlobalLoading(attempt = 1) {
    activeRequests++;
    if (typeof document !== 'undefined') {
        const bar = document.getElementById('globalLoadingBar');
        if (bar) {
            bar.classList.remove('hidden');
            const txt = document.getElementById('globalLoadingBarText');
            if (txt) {
                txt.textContent = attempt > 1 
                    ? `Reconectando ao servidor (tentativa ${attempt})...` 
                    : 'Carregando dados...';
            }
        }
        const app = document.getElementById('app');
        if (app) app.setAttribute('aria-busy', 'true');
        announceLoading(attempt > 1 ? `Reconectando, tentativa ${attempt}` : 'Carregando dados...');
    }
}

/**
 * Oculta feedback visual global de carregamento.
 */
function hideGlobalLoading() {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests === 0 && typeof document !== 'undefined') {
        const bar = document.getElementById('globalLoadingBar');
        if (bar) {
            bar.classList.add('hidden');
            const txt = document.getElementById('globalLoadingBarText');
            if (txt) txt.textContent = '';
        }
        const app = document.getElementById('app');
        if (app) app.removeAttribute('aria-busy');
        announceComplete();
    }
}

/**
 * Executes a Firebase function with automatic retry policy.
 * @template T
 * @param {() => Promise<T>} fn
 * @param {import('./retry.js').RetryOptions<T>} [options]
 * @returns {Promise<T>}
 */
export async function withRetry(fn, options = {}) {
    showGlobalLoading(1);
    try {
        return await executeWithRetry(fn, {
            maxRetries: 3,
            initialDelayMs: 500,
            maxDelayMs: 4000,
            backoffFactor: 2,
            jitter: true,
            onRetry: (attempt, error, delayMs) => {
                console.warn(`[Firebase Retry ${attempt}/3] Tentando novamente em ${delayMs}ms devido a:`, error?.message || error);
                showGlobalLoading(attempt + 1);
            },
            ...options
        });
    } finally {
        hideGlobalLoading();
    }
}

/**
 * @param {any} query
 * @returns {Promise<any>}
 */
export async function getDocs(query) {
    return withRetry(() => _getDocs(query));
}

/**
 * @param {any} reference
 * @returns {Promise<any>}
 */
export async function getDoc(reference) {
    return withRetry(() => _getDoc(reference));
}

/**
 * @param {any} reference
 * @param {any} data
 * @returns {Promise<any>}
 */
export async function addDoc(reference, data) {
    return withRetry(() => _addDoc(reference, data));
}

/**
 * @param {any} reference
 * @param {any} data
 * @param {any} [options]
 * @returns {Promise<any>}
 */
export async function setDoc(reference, data, options) {
    return withRetry(() => _setDoc(reference, data, options));
}

/**
 * @param {any} reference
 * @param {any} data
 * @returns {Promise<any>}
 */
export async function updateDoc(reference, data) {
    return withRetry(() => _updateDoc(reference, data));
}

/**
 * @param {any} reference
 * @returns {Promise<any>}
 */
export async function deleteDoc(reference) {
    return withRetry(() => _deleteDoc(reference));
}

/**
 * @param {any} db
 * @returns {any}
 */
export function writeBatch(db) {
    const batch = _writeBatch(db);
    const _set = batch.set.bind(batch);
    const _update = batch.update.bind(batch);
    const _delete = batch.delete.bind(batch);
    const _commit = batch.commit.bind(batch);

    batch.set = (ref, data, opts) => _set(ref, data, opts);
    batch.update = (ref, data) => _update(ref, data);
    batch.delete = (ref) => _delete(ref);
    batch.commit = () => withRetry(() => _commit());

    return batch;
}
