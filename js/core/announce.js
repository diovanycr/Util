/**
 * announce.js — Anunciador acessível de estados de carregamento
 *
 * Fornece funções para anunciar carregamentos para leitores de tela via
 * uma região aria-live="polite" centralizada no documento.
 *
 * Uso:
 *   import { announceLoading, announceComplete } from './announce.js';
 *   announceLoading('Carregando mensagens...');
 *   announceComplete('Mensagens carregadas.');
 */

const ANNOUNCER_ID = 'a11y-loading-announcer';

/**
 * Retorna o elemento announcer, criando-o se necessário.
 * @returns {HTMLElement|null}
 */
function getAnnouncer() {
    if (typeof document === 'undefined') return null;
    let el = document.getElementById(ANNOUNCER_ID);
    if (!el) {
        el = document.createElement('div');
        el.id = ANNOUNCER_ID;
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-atomic', 'true');
        el.className = 'sr-only';
        document.body.appendChild(el);
    }
    return el;
}

/**
 * Anuncia o início de um carregamento para leitores de tela.
 * @param {string} [message] - Mensagem a anunciar (padrão: 'Carregando...')
 */
export function announceLoading(message = 'Carregando...') {
    const el = getAnnouncer();
    if (!el) return;
    // Limpar e repopular para garantir que o aria-live dispare mesmo com texto igual
    el.textContent = '';
    requestAnimationFrame(() => { el.textContent = message; });
}

/**
 * Anuncia a conclusão de um carregamento para leitores de tela.
 * @param {string} [message] - Mensagem de conclusão (padrão: string vazia — silencioso)
 */
export function announceComplete(message = '') {
    const el = getAnnouncer();
    if (!el) return;
    el.textContent = '';
    if (message) {
        requestAnimationFrame(() => { el.textContent = message; });
    }
}
