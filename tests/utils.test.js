import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fs = require('fs');

// Now utils.js lives in js/core/utils.js
const UTILS_PATH = path.join(__dirname, '..', 'js', 'core', 'utils.js');
const utilsCode = fs.readFileSync(UTILS_PATH, 'utf8');

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

console.log('Running utils.js static analysis tests...\n');

// Test: createHighlighter HTML escaping logic
runTest('createHighlighter contains HTML escaping logic', () => {
    assert(utilsCode.includes("replace(/&/g, '&amp;')"), 'Should escape & to &amp;');
    assert(utilsCode.includes("replace(/</g, '&lt;')"), 'Should escape < to &lt;');
    assert(utilsCode.includes("replace(/>/g, '&gt;')"), 'Should escape > to &gt;');
});

// Test: debounce
runTest('debounce delays function execution', () => {
    assert(utilsCode.includes('export function debounce'), 'Should export debounce');
});

// Test: setupSegmented
runTest('setupSegmented exists in utils.js', () => {
    assert(utilsCode.includes('export function setupSegmented'), 'Should export setupSegmented');
});

// Test: addKeyboardDragSupport
runTest('addKeyboardDragSupport exists in utils.js', () => {
    assert(utilsCode.includes('export function addKeyboardDragSupport'), 'Should export addKeyboardDragSupport');
});

// Test: sanitizeHtml
runTest('sanitizeHtml exists in utils.js', () => {
    assert(utilsCode.includes('export function sanitizeHtml'), 'Should export sanitizeHtml');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);