import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fs = require('fs');

const LOADER_PATH    = path.join(__dirname, '..', 'js', 'modules', 'messages', 'loader.js');
const MESSAGES_PATH  = path.join(__dirname, '..', 'js', 'modules', 'messages.js');
const SHORTCUTS_PATH = path.join(__dirname, '..', 'js', 'core', 'shortcuts.js');
const INDEX_PATH     = path.join(__dirname, '..', 'index.html');

const loaderCode    = fs.readFileSync(LOADER_PATH, 'utf8');
const messagesCode  = fs.readFileSync(MESSAGES_PATH, 'utf8');
const shortcutsCode = fs.readFileSync(SHORTCUTS_PATH, 'utf8');
const indexHtml     = fs.readFileSync(INDEX_PATH, 'utf8');

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

console.log('Running Message Inline Search (Ctrl+F) integrity tests...\n');

runTest('index.html contains #msgSearch input inside tabMessages toolbar', () => {
    assert(indexHtml.includes('id="msgSearch"'), 'Should define #msgSearch input element');
    assert(indexHtml.includes('Pesquisar mensagens'), 'Should have descriptive placeholder for msgSearch');
});

runTest('loader.js exports applyMessageSearchQuery', () => {
    assert(loaderCode.includes('export function applyMessageSearchQuery'), 'Should export applyMessageSearchQuery');
});

runTest('loader.js applyMessageSearchQuery applies highlight with <mark>', () => {
    assert(loaderCode.includes('<mark>$1</mark>'), 'Should wrap matched terms in <mark> tags');
});

runTest('loader.js applyMessageSearchQuery toggles hidden-by-search class', () => {
    assert(loaderCode.includes("'hidden-by-search'") || loaderCode.includes('"hidden-by-search"'), 'Should use .hidden-by-search class to hide non-matching messages');
});

runTest('messages.js imports and re-exports applyMessageSearchQuery', () => {
    assert(messagesCode.includes('applyMessageSearchQuery'), 'Should import applyMessageSearchQuery from loader.js');
});

runTest('messages.js binds msgSearch input listener', () => {
    assert(messagesCode.includes("'msgSearch'") || messagesCode.includes('"msgSearch"'), 'Should bind input listener to #msgSearch');
});

runTest('shortcuts.js adds Alt+F and / shortcuts to focus msgSearch', () => {
    assert(shortcutsCode.includes("e.altKey") && (shortcutsCode.includes("e.key === 'f'") || shortcutsCode.includes("e.key === 'F'")), 'Should detect Alt+F key');
    assert(shortcutsCode.includes("e.key === '/'"), 'Should detect / key for search');
    assert(shortcutsCode.includes("'msgSearch'") || shortcutsCode.includes('"msgSearch"'), 'Should target #msgSearch element');
    assert(shortcutsCode.includes('msgSearch.focus()'), 'Should call focus() on #msgSearch');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
