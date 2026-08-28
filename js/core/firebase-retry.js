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

const RETRY_DELAYS = [1000, 2000, 4000];

let activeRequests = 0;

function showGlobalLoading() {
    activeRequests++;
    if (typeof document !== 'undefined') {
        const bar = document.getElementById('globalLoadingBar');
        if (bar) {
            bar.classList.remove('hidden');
            const txt = document.getElementById('globalLoadingBarText');
            if (txt) txt.textContent = 'Carregando dados...';
        }
        const app = document.getElementById('app');
        if (app) app.setAttribute('aria-busy', 'true');
        announceLoading('Carregando dados...');
    }
}

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

export async function withRetry(fn, retries = 3) {
    showGlobalLoading();
    try {
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (error) {
                const isLast = i === retries - 1;
                const isRetryable =
                    error.code === 'unavailable' ||
                    error.code === 'deadline-exceeded' ||
                    error.code === 'resource-exhausted' ||
                    error.message?.includes('network') ||
                    error.message?.includes('timeout');

                if (isLast || !isRetryable) {
                    throw error;
                }

                const delay = RETRY_DELAYS[i] || 4000;
                console.warn(`Retry ${i + 1}/${retries} after ${delay}ms:`, error.message);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    } finally {
        hideGlobalLoading();
    }
}

export async function getDocs(query) {
    return withRetry(() => _getDocs(query));
}

export async function getDoc(reference) {
    return withRetry(() => _getDoc(reference));
}

export async function addDoc(reference, data) {
    return withRetry(() => _addDoc(reference, data));
}

export async function setDoc(reference, data, options) {
    return withRetry(() => _setDoc(reference, data, options));
}

export async function updateDoc(reference, data) {
    return withRetry(() => _updateDoc(reference, data));
}

export async function deleteDoc(reference) {
    return withRetry(() => _deleteDoc(reference));
}

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


