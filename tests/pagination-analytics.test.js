/**
 * pagination-analytics.test.js — Testes de integridade estática e estrutural para Paginação e Analytics
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.join(__dirname, '..');

describe('Paginação e Otimização do Analytics', () => {
    it('loader.js deve implementar paginação por cursor (startAfter, MSG_PAGE_SIZE = 50)', () => {
        const loaderPath = path.join(BASE_DIR, 'js', 'modules', 'messages', 'loader.js');
        const content = readFileSync(loaderPath, 'utf8');

        assert.ok(content.includes('startAfter'), 'loader.js deve importar e utilizar startAfter do firebase');
        assert.ok(content.includes('MSG_PAGE_SIZE = 50'), 'loader.js deve definir a constante MSG_PAGE_SIZE com 50');
        assert.ok(content.includes('export function resetMsgPagination'), 'loader.js deve exportar resetMsgPagination');
        assert.ok(content.includes('btnLoadMoreMsgs'), 'loader.js deve renderizar o botão btnLoadMoreMsgs ao atingir o limite da página');
    });

    it('messages.js deve resetar o cursor ao invocar resetMessages', () => {
        const messagesPath = path.join(BASE_DIR, 'js', 'modules', 'messages.js');
        const content = readFileSync(messagesPath, 'utf8');

        assert.ok(content.includes('resetMsgPagination'), 'messages.js deve importar e chamar resetMsgPagination');
    });

    it('analytics.js deve reutilizar allMessages e allProblems em memória', () => {
        const analyticsPath = path.join(BASE_DIR, 'js', 'modules', 'analytics.js');
        const content = readFileSync(analyticsPath, 'utf8');

        assert.ok(content.includes("import { allMessages } from './messages/state.js'"), 'analytics.js deve importar allMessages');
        assert.ok(content.includes("import { allProblems } from './problems.js'"), 'analytics.js deve importar allProblems');
        assert.ok(content.includes('let msgs = allMessages'), 'analytics.js deve atribuir allMessages a msgs para evitar queries redundantes');
        assert.ok(content.includes('let probs = allProblems'), 'analytics.js deve atribuir allProblems a probs para evitar queries redundantes');
    });
});
