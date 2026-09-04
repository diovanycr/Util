/**
 * tests/undo-delete.test.js
 *
 * Testes unitários para o serviço centralizado de exclusão recuperável (undoService).
 */

import { scheduleUndoDelete, confirmDelete, undoDelete, flushAllPendingDeletes } from '../js/core/undoService.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed++;
        console.log(`  ✓ ${message}`);
    } else {
        failed++;
        console.error(`  ✗ ${message}`);
    }
}

function runTest(name, fn) {
    console.log(`\nTest: ${name}`);
    try {
        fn();
    } catch (e) {
        failed++;
        console.error(`  ✗ Threw: ${(/** @type {Error} */ (e)).message}`);
    }
}

// Global DOM stub para tsc
const dummyElem = /** @type {any} */ ({
    className: '',
    setAttribute: () => {},
    appendChild: () => {},
    style: {},
    addEventListener: () => {},
    remove: () => {}
});

globalThis.document = /** @type {any} */ ({
    querySelector: () => null,
    createElement: () => dummyElem,
    body: {
        appendChild: () => {},
        contains: () => false
    }
});

console.log('Running undoService unit tests...\n');

runTest('scheduleUndoDelete executa onConfirm após expirar a janela de tempo', () => {
    let confirmed = false;
    let undone = false;

    scheduleUndoDelete('test-1', {
        message: 'Item removido',
        onConfirm: () => { confirmed = true; },
        onUndo: () => { undone = true; },
        durationMs: 50
    });

    assert(!confirmed, 'Não deve confirmar imediatamente');
    assert(!undone, 'Não deve chamar undo');

    // Força a confirmação manual via helper
    confirmDelete('test-1');
    assert(confirmed, 'Deve confirmar após chamada manual ou timeout');
    assert(!undone, 'Não deve chamar undo no confirm');
});

runTest('undoDelete cancela a confirmação e chama callback onUndo', () => {
    let confirmed = false;
    let undone = false;

    scheduleUndoDelete('test-2', {
        message: 'Item removido',
        onConfirm: () => { confirmed = true; },
        onUndo: () => { undone = true; },
        durationMs: 5000
    });

    undoDelete('test-2');
    assert(!confirmed, 'Não deve confirmar se foi desfeito');
    assert(undone, 'Deve chamar callback onUndo');

    // Tentar confirmar novamente não deve ter efeito
    confirmDelete('test-2');
    assert(!confirmed, 'Confirmação secundária deve ser ignorada');
});

runTest('flushAllPendingDeletes processa todas as exclusões pendentes', () => {
    let count = 0;

    scheduleUndoDelete('batch-1', {
        message: 'Item 1',
        onConfirm: () => { count++; },
        onUndo: () => {},
        durationMs: 10000
    });

    scheduleUndoDelete('batch-2', {
        message: 'Item 2',
        onConfirm: () => { count++; },
        onUndo: () => {},
        durationMs: 10000
    });

    flushAllPendingDeletes();
    assert(count === 2, 'Todas as deleções pendentes devem ser confirmadas no flush');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
