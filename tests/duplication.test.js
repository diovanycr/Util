import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fs = require('fs');

const MSG_LOADER_PATH = path.join(__dirname, '..', 'js', 'modules', 'messages', 'loader.js');
const PROB_RENDER_PATH = path.join(__dirname, '..', 'js', 'modules', 'problems', 'problem-render.js');

const msgLoaderCode = fs.readFileSync(MSG_LOADER_PATH, 'utf8');
const probRenderCode = fs.readFileSync(PROB_RENDER_PATH, 'utf8');

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

console.log('Running duplication feature integrity tests...\n');

runTest('messages/loader.js contains duplication logic', () => {
    assert(msgLoaderCode.includes('btn-duplicate'), 'Should render btn-duplicate button');
    assert(msgLoaderCode.includes('(Cópia)'), 'Should title copy with (Cópia)');
    assert(msgLoaderCode.includes('Mensagem duplicada!'), 'Should show success toast on message copy');
});

runTest('problems/problem-render.js contains duplication logic', () => {
    assert(probRenderCode.includes('btn-duplicate-problem'), 'Should render btn-duplicate-problem button');
    assert(probRenderCode.includes('(Cópia)'), 'Should title copy with (Cópia)');
    assert(probRenderCode.includes('Problema duplicado!'), 'Should show success toast on problem copy');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
