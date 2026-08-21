import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fs = require('fs');

const SEARCH_PATH = path.join(__dirname, '..', 'js', 'modules', 'search.js');
const searchCode = fs.readFileSync(SEARCH_PATH, 'utf8');

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
        console.error(`  ✗ Threw: ${e.message}`);
    }
}

console.log('Running Command Palette (Ctrl+K) integrity tests...\n');

runTest('search.js defines SYSTEM_TOOLS', () => {
    assert(searchCode.includes('export const SYSTEM_TOOLS ='), 'Should export SYSTEM_TOOLS');
    assert(searchCode.includes("key: 'portopener'"), 'Should include portopener tool');
    assert(searchCode.includes("key: 'statuschecker'"), 'Should include statuschecker tool');
    assert(searchCode.includes("key: 'escpos'"), 'Should include escpos tool');
    assert(searchCode.includes("key: 'decisiontree'"), 'Should include decisiontree tool');
});

runTest('search.js defines SYSTEM_COMMANDS', () => {
    assert(searchCode.includes('export const SYSTEM_COMMANDS ='), 'Should export SYSTEM_COMMANDS');
    assert(searchCode.includes("'Ir para Mensagens'"), 'Should include navigation to Messages');
    assert(searchCode.includes("'Ir para Problemas / Base de Conhecimento'"), 'Should include navigation to Problems');
    assert(searchCode.includes("'Nova Mensagem'"), 'Should include action to create Message');
    assert(searchCode.includes("'Abrir Assistente de IA'"), 'Should include action to open AI Assistant');
});

runTest('search.js runSearch includes tools and commands in output', () => {
    assert(searchCode.includes("buildSection('terminal', 'Comandos & Ações'"), 'Should render Commands section');
    assert(searchCode.includes("buildSection('toolbox', 'Ferramentas do Sistema'"), 'Should render System Tools section');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
