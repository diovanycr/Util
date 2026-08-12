import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fs = require('fs');

const BASE_DIR = path.join(__dirname, '..');

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

function src(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

console.log('Running XSS regression tests...\n');

// --- statusChecker.js ---
console.log('Test: statusChecker.js XSS escapes');
{
    const code = src(path.join(BASE_DIR, 'js', 'statusChecker.js'));
    assert(code.includes("import { setupSegmented, escapeAttr } from './utils.js'") === true,
        'Should import escapeAttr from utils.js');
    assert(code.includes('escapeAttr(item.url)') === true,
        'Should escape item.url via escapeAttr');
    assert(code.includes('escapeAttr(item.statusUrl)') === true,
        'Should escape item.statusUrl via escapeAttr');
    assert(code.includes('escapeAttr(id)') === true,
        'Should escape card id via escapeAttr');
    assert(code.includes('escapeAttr(label)') === true,
        'Should escape card label via escapeAttr');
    assert(code.includes('escapeAttr(subLabel)') === true,
        'Should escape card subLabel via escapeAttr');
}

// --- decisionTree.js ---
console.log('\nTest: decisionTree.js XSS escapes');
{
    const code = src(path.join(BASE_DIR, 'js', 'decisionTree.js'));
    assert(code.includes("import { escapeHtml, escapeAttr } from './utils.js'") === true,
        'Should import escapeHtml and escapeAttr from utils.js');
    assert(code.includes('escapeHtml(tree.icon)') === true,
        'Should escape tree.icon via escapeHtml in panel builder');
    assert(code.includes('escapeHtml(tree.title)') === true,
        'Should escape tree.title via escapeHtml in panel builder');
    assert(code.includes('escapeAttr(key)') === true,
        'Should escape tree key via escapeAttr in data-tree');
    assert(code.includes('escapeHtml(currentTree.icon)') === true,
        'Should escape currentTree.icon in breadcrumb');
    assert(code.includes('escapeHtml(currentTree.title)') === true,
        'Should escape currentTree.title in breadcrumb');
    assert(code.includes('escapeHtml(node.answer)') === true,
        'Should escape node.answer via escapeHtml');
    assert(code.includes('escapeHtml(node.solution)') === true,
        'Should escape node.solution via escapeHtml');
    assert(code.includes('escapeHtml(node.question)') === true,
        'Should escape node.question via escapeHtml');
    assert(code.includes('escapeHtml(opt.label)') === true,
        'Should escape opt.label via escapeHtml');
    assert(code.includes('escapeAttr(opt.next)') === true,
        'Should escape opt.next via escapeAttr in data-next');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
