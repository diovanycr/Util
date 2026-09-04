/**
 * throttle.js — Proteção contra rate limiting para leituras do Firestore
 *
 * Fornece dois mecanismos:
 *  - `createLoadThrottle(minIntervalMs)` — garante que uma função de carga
 *    não seja chamada mais de uma vez por intervalo de tempo, mesmo que
 *    disparada repetidamente (ex.: troca rápida de abas, botão duplo-clique).
 *  - `createConcurrencyGuard()` — impede execuções paralelas da mesma operação.
 *
 * Design:
 *  - Sem dependências externas.
 *  - 100 % testável em Node.js via injeção de `Date.now`.
 *  - Não usa setTimeout nem promessas internas — sem efeitos colaterais.
 */

/**
 * @typedef {Object} LoadThrottle
 * @property {(fn: () => Promise<void>) => Promise<void>} call
 *   Chama `fn` somente se o intervalo mínimo desde a última chamada tiver passado.
 *   Se estiver dentro do intervalo, retorna imediatamente (sem executar `fn`).
 * @property {() => boolean} isThrottled
 *   Retorna `true` se uma chamada seria bloqueada agora.
 * @property {() => void} reset
 *   Zera o timestamp da última chamada (útil para testes e logout).
 */

/**
 * Cria um throttle de carregamento baseado em intervalo mínimo.
 *
 * @param {Object} [options]
 * @param {number}   [options.minIntervalMs=2000]  Intervalo mínimo entre chamadas (ms).
 * @param {() => number} [options.now=Date.now]    Injeção de relógio para testes.
 * @returns {LoadThrottle}
 *
 * @example
 * const throttle = createLoadThrottle({ minIntervalMs: 2000 });
 * // Em um event handler:
 * tabBtn.onclick = () => throttle.call(() => loadMessages(userId));
 */
export function createLoadThrottle({ minIntervalMs = 2000, now = Date.now } = {}) {
    // -Infinity garante que a primeira chamada SEMPRE passe,
    // independente do valor retornado por `now`.
    let _lastCallAt = -Infinity;
    let _inFlight   = false;

    return {
        /**
         * Executa `fn` se:
         *  1. Nenhuma execução estiver em andamento (`_inFlight === false`), E
         *  2. Passou tempo suficiente desde a última chamada (`now() - _lastCallAt >= minIntervalMs`).
         *
         * Caso contrário, retorna imediatamente sem executar `fn`.
         *
         * @param {() => Promise<void>} fn
         * @returns {Promise<void>}
         */
        async call(fn) {
            const elapsed = now() - _lastCallAt;
            if (_inFlight || elapsed < minIntervalMs) return;

            _inFlight   = true;
            _lastCallAt = now();
            try {
                await fn();
            } catch (err) {
                // Libera o guard mas não atualiza lastCallAt (erro não conta como sucesso)
                _lastCallAt = -Infinity;
                throw err;
            } finally {
                _inFlight = false;
            }
        },

        /** @returns {boolean} */
        isThrottled() {
            return _inFlight || (now() - _lastCallAt) < minIntervalMs;
        },

        reset() {
            _lastCallAt = -Infinity;
            _inFlight   = false;
        }
    };
}

/**
 * Cria um guard de concorrência simples.
 * Impede que a mesma operação assíncrona rode em paralelo.
 *
 * @returns {{ call: (fn: () => Promise<void>) => Promise<void>, isRunning: () => boolean, reset: () => void }}
 *
 * @example
 * const guard = createConcurrencyGuard();
 * btnReload.onclick = () => guard.call(() => loadMessages(userId));
 */
export function createConcurrencyGuard() {
    let _running = false;

    return {
        async call(fn) {
            if (_running) return;
            _running = true;
            try {
                await fn();
            } finally {
                _running = false;
            }
        },

        /** @returns {boolean} */
        isRunning() { return _running; },

        reset() { _running = false; }
    };
}
