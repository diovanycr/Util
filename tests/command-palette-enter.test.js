import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fs = require('fs');

const SEARCH_PATH = path.join(__dirname, '..', 'js', 'modules', 'search.js');
const SHORTCUTS_PATH = path.join(__dirname, '..', 'js', 'core', 'shortcuts.js');

const searchCode = fs.readFileSync(SEARCH_PATH, 'utf8');
const shortcutsCode = fs.readFileSync(SHORTCUTS_PATH, 'utf8');

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

console.log('Running Command Palette Enter Key & Navigation tests...\n');

runTest('shortcuts.js _activateSelected triggers primary click action on selected item', () => {
    assert(shortcutsCode.includes('function _activateSelected'), 'Should define _activateSelected');
    assert(shortcutsCode.includes('selected.click()'), '_activateSelected should call selected.click() directly for navigation');
    assert(!shortcutsCode.includes('copyBtn.click()'), '_activateSelected should not force copyBtn.click() over primary action');
});

runTest('search.js message results navigate to tabMessages on primary click', () => {
    assert(searchCode.includes("clickTab('tabMessages')") || searchCode.includes("data-tab=\"tabMessages\""), 'Message result primary action should click tabMessages tab');
    assert(searchCode.includes("msgSearch"), 'Message result primary action should target msgSearch input');
    assert(searchCode.includes("search-copy-btn"), 'Message result should preserve secondary search-copy-btn');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
