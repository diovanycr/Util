/**
 * lazy-tools.test.js — Testes unitários para lazy-loading das ferramentas no Port Opener
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.join(__dirname, '..');

describe('Lazy-loading das Ferramentas no Port Opener', () => {
    it('portOpener.js não deve importar estaticamente ferramentas secundárias pesadas', () => {
        const poPath = path.join(BASE_DIR, 'js', 'tools', 'portOpener.js');
        const content = readFileSync(poPath, 'utf8');

        // Não deve haver imports estáticos de topo de nível para estes arquivos
        assert.equal(content.includes("import { bindDecisionTreeEvents"), false, 'decisionTree não deve ser importado estaticamente');
        assert.equal(content.includes("import { bindDocValidatorEvents"), false, 'docValidatorUI não deve ser importado estaticamente');
        assert.equal(content.includes("import { bindStatusCheckerEvents"), false, 'statusChecker não deve ser importado estaticamente');
        assert.equal(content.includes("import { bindFileValidatorEvents"), false, 'fileValidator não deve ser importado estaticamente');
        assert.equal(content.includes("import { bindApiTesterEvents"), false, 'apiTester não deve ser importado estaticamente');
    });

    it('portOpener.js deve definir a tabela TOOL_LOADERS para carregamento dinâmico', () => {
        const poPath = path.join(BASE_DIR, 'js', 'tools', 'portOpener.js');
        const content = readFileSync(poPath, 'utf8');

        assert.ok(content.includes('const TOOL_LOADERS ='), 'deve definir TOOL_LOADERS');
        assert.ok(content.includes("await import('./decisionTree.js')"), 'deve importar decisionTree dinamicamente sob demanda');
        assert.ok(content.includes("await import('./docValidatorUI.js')"), 'deve importar docValidatorUI dinamicamente sob demanda');
        assert.ok(content.includes("await import('./fileValidator.js')"), 'deve importar fileValidator dinamicamente sob demanda');
    });

    it('portOpener.js deve manter as exportações públicas renderSistemasTab e cleanupPortOpener', () => {
        const poPath = path.join(BASE_DIR, 'js', 'tools', 'portOpener.js');
        const content = readFileSync(poPath, 'utf8');

        assert.ok(content.includes('export function renderSistemasTab'), 'deve exportar renderSistemasTab');
        assert.ok(content.includes('export function cleanupPortOpener'), 'deve exportar cleanupPortOpener');
    });
});
