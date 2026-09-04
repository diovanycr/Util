/**
 * throttle.test.js — Testes unitários determinísticos para js/core/throttle.js
 *
 * Usa injeção de relógio (now) para controlar o tempo sem precisar de
 * setTimeout real ou timers falsos.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// Importação direta via caminho relativo (funciona no ESM do Node no Windows)
const { createLoadThrottle, createConcurrencyGuard } = await import('../js/core/throttle.js');

// ---------------------------------------------------------------------------

describe('createLoadThrottle', () => {
    it('chama fn imediatamente na primeira invocação', async () => {
        let called = 0;
        let t = 0;
        const throttle = createLoadThrottle({ minIntervalMs: 2000, now: () => t });

        await throttle.call(async () => { called++; });
        assert.equal(called, 1);
    });

    it('bloqueia segunda chamada dentro do intervalo mínimo', async () => {
        let called = 0;
        let t = 0;
        const throttle = createLoadThrottle({ minIntervalMs: 2000, now: () => t });

        await throttle.call(async () => { called++; });
        t = 500; // ainda dentro dos 2000 ms
        await throttle.call(async () => { called++; });

        assert.equal(called, 1, 'segunda chamada deve ser ignorada');
    });

    it('permite chamada após o intervalo mínimo passar', async () => {
        let called = 0;
        let t = 0;
        const throttle = createLoadThrottle({ minIntervalMs: 2000, now: () => t });

        await throttle.call(async () => { called++; });
        t = 2001; // passou o intervalo
        await throttle.call(async () => { called++; });

        assert.equal(called, 2);
    });

    it('bloqueia chamadas concorrentes (inFlight)', async () => {
        let t = 0;
        const throttle = createLoadThrottle({ minIntervalMs: 0, now: () => t });

        let resolveFirst;
        const firstDone = new Promise(r => { resolveFirst = r; });
        let secondCalled = false;

        // Primeira chamada fica pendente
        const first = throttle.call(async () => { await firstDone; });

        // Segunda chamada feita enquanto primeira está em andamento
        const second = throttle.call(async () => { secondCalled = true; });

        resolveFirst(); // resolve a primeira
        await first;
        await second;

        assert.equal(secondCalled, false, 'segunda chamada concorrente deve ser descartada');
    });

    it('isThrottled retorna true durante o intervalo', async () => {
        let t = 0;
        const throttle = createLoadThrottle({ minIntervalMs: 2000, now: () => t });

        await throttle.call(async () => {});
        t = 999;
        assert.equal(throttle.isThrottled(), true);
    });

    it('isThrottled retorna false após o intervalo expirar', async () => {
        let t = 0;
        const throttle = createLoadThrottle({ minIntervalMs: 2000, now: () => t });

        await throttle.call(async () => {});
        t = 2001;
        assert.equal(throttle.isThrottled(), false);
    });

    it('reset permite nova chamada imediatamente', async () => {
        let called = 0;
        let t = 0;
        const throttle = createLoadThrottle({ minIntervalMs: 2000, now: () => t });

        await throttle.call(async () => { called++; });
        t = 100; // dentro do intervalo

        throttle.reset();
        await throttle.call(async () => { called++; }); // deve passar após reset

        assert.equal(called, 2);
    });

    it('propaga exceções da fn e permite retry imediato', async () => {
        let t = 0;
        const throttle = createLoadThrottle({ minIntervalMs: 2000, now: () => t });

        await assert.rejects(
            () => throttle.call(async () => { throw new Error('boom'); }),
            /boom/
        );

        // Após erro, _lastCallAt é resetado para -Infinity,
        // então a próxima chamada passa SEM precisar avançar o clock
        let called = false;
        await throttle.call(async () => { called = true; });
        assert.equal(called, true, 'deve funcionar imediatamente após erro');
    });
});

describe('createConcurrencyGuard', () => {
    it('executa fn normalmente', async () => {
        const guard = createConcurrencyGuard();
        let called = 0;
        await guard.call(async () => { called++; });
        assert.equal(called, 1);
    });

    it('descarta segunda chamada enquanto primeira está em andamento', async () => {
        const guard = createConcurrencyGuard();
        let resolveFirst;
        const firstDone = new Promise(r => { resolveFirst = r; });
        let secondCalled = false;

        const first = guard.call(async () => { await firstDone; });
        const second = guard.call(async () => { secondCalled = true; });

        resolveFirst();
        await first;
        await second;

        assert.equal(secondCalled, false);
    });

    it('isRunning retorna true durante execução', async () => {
        const guard = createConcurrencyGuard();
        let resolveFirst;
        const firstDone = new Promise(r => { resolveFirst = r; });
        let wasRunning = false;

        const first = guard.call(async () => {
            wasRunning = guard.isRunning();
            await firstDone;
        });

        resolveFirst();
        await first;
        assert.equal(wasRunning, true);
        assert.equal(guard.isRunning(), false);
    });

    it('reset libera o guard manualmente', async () => {
        const guard = createConcurrencyGuard();
        // força estado "running" manualmente via reset
        // (simula crash sem finally)
        let resolveFirst;
        const firstDone = new Promise(r => { resolveFirst = r; });

        guard.call(async () => { await firstDone; }); // não await
        assert.equal(guard.isRunning(), true);

        guard.reset();
        assert.equal(guard.isRunning(), false);

        let called = false;
        await guard.call(async () => { called = true; });
        assert.equal(called, true);

        resolveFirst(); // limpa a promise pendente
    });
});
