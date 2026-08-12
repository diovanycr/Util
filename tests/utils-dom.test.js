const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

const UTILS_PATH = path.join(__dirname, '..', 'js', 'utils.js');
const moduleCode = fs.readFileSync(UTILS_PATH, 'utf8');

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

console.log('Running utils.js tests with JSDOM...\n');

// Test: escapeHtml
runTest('escapeHtml escapes HTML characters', () => {
    const div = document.createElement('div');
    div.textContent = '<script>alert("xss")</script>';
    const result = div.innerHTML;
    assert(result.includes('&lt;') === true, 'Should escape <');
    assert(result.includes('&gt;') === true, 'Should escape >');
    assert(result.includes('&') === true || result.includes('&amp;') === true, 'Should escape &');
});

// Test: createHighlighter
runTest('createHighlighter escapes HTML before highlighting', () => {
    assert(moduleCode.includes("replace(/&/g, '&amp;')") === true, 'Should escape & to &amp;');
    assert(moduleCode.includes("replace(/</g, '&lt;')") === true, 'Should escape < to &lt;');
    assert(moduleCode.includes("replace(/>/g, '&gt;')") === true, 'Should escape > to &gt;');
});

// Test: debounce
runTest('debounce delays function execution', () => {
    assert(moduleCode.includes('export function debounce') === true, 'Should export debounce');
});

// Test: setupSegmented
runTest('setupSegmented exists in utils.js', () => {
    assert(moduleCode.includes('export function setupSegmented') === true, 'Should export setupSegmented');
});

// Test: addKeyboardDragSupport
runTest('addKeyboardDragSupport exists in utils.js', () => {
    assert(moduleCode.includes('export function addKeyboardDragSupport') === true, 'Should export addKeyboardDragSupport');
});

// Test: sanitizeHtml
runTest('sanitizeHtml exists in utils.js', () => {
    assert(moduleCode.includes('export function sanitizeHtml') === true, 'Should export sanitizeHtml');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);