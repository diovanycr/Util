import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fs = require('fs');

const SHORTCUTS_PATH    = path.join(__dirname, '..', 'js', 'core', 'shortcuts.js');
const ENHANCEMENTS_PATH = path.join(__dirname, '..', 'js', 'core', 'enhancements.js');
const INDEX_PATH        = path.join(__dirname, '..', 'index.html');

const shortcutsCode    = fs.readFileSync(SHORTCUTS_PATH, 'utf8');
const enhancementsCode = fs.readFileSync(ENHANCEMENTS_PATH, 'utf8');
const indexHtml        = fs.readFileSync(INDEX_PATH, 'utf8');

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

console.log('Running Native Ctrl+F Preservation & Alt+F / / Search Shortcut tests...\n');

runTest('shortcuts.js and enhancements.js do NOT intercept browser native Ctrl+F', () => {
    const shortcutsCtrlF = shortcutsCode.includes("e.ctrlKey && e.key === 'f'") || shortcutsCode.includes('e.ctrlKey && e.key === "f"');
    const enhancementsCtrlF = enhancementsCode.includes("e.ctrlKey && e.key === 'f'") || enhancementsCode.includes('e.ctrlKey && e.key === "f"');
    assert(!shortcutsCtrlF, 'shortcuts.js should not intercept Ctrl+F');
    assert(!enhancementsCtrlF, 'enhancements.js should not intercept Ctrl+F');
});

runTest('shortcuts.js binds Alt+F and / for local search focus', () => {
    assert(shortcutsCode.includes('e.altKey'), 'shortcuts.js should check e.altKey');
    assert(shortcutsCode.includes("e.key === '/'"), 'shortcuts.js should check e.key === "/"');
    assert(shortcutsCode.includes('msgSearch.focus()'), 'shortcuts.js should focus msgSearch');
});

runTest('enhancements.js binds Alt+F for header search focus', () => {
    assert(enhancementsCode.includes('e.altKey'), 'enhancements.js should check e.altKey');
});

runTest('index.html placeholders and help modal mention Alt+F and /', () => {
    assert(indexHtml.includes('Alt+F ou /'), 'msgSearch placeholder should mention Alt+F ou /');
    assert(indexHtml.includes('<kbd>Alt</kbd>'), 'Help shortcuts modal should list Alt key');
    assert(indexHtml.includes('<kbd>/</kbd>'), 'Help shortcuts modal should list / key');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
