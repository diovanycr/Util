import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fs = require('fs');

const PROB_RENDER_PATH = path.join(__dirname, '..', 'js', 'modules', 'problems', 'problem-render.js');
const INDEX_HTML_PATH = path.join(__dirname, '..', 'index.html');

const probRenderCode = fs.readFileSync(PROB_RENDER_PATH, 'utf8');
const indexHtmlCode = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

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

console.log('Running solution status filter tests...\n');

runTest('index.html contains problemStatusFilter select element', () => {
    assert(indexHtmlCode.includes('id="problemStatusFilter"'), 'Should render problemStatusFilter select');
    assert(indexHtmlCode.includes('value="confirmed"'), 'Should have confirmed option');
    assert(indexHtmlCode.includes('value="testing"'), 'Should have testing option');
    assert(indexHtmlCode.includes('value="obsolete"'), 'Should have obsolete option');
});

runTest('problem-render.js applyFilters handles matchStatus', () => {
    assert(probRenderCode.includes('problemStatusFilter'), 'Should check problemStatusFilter');
    assert(probRenderCode.includes('matchStatus'), 'Should calculate matchStatus');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
