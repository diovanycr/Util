import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fs = require('fs');

const PROB_RENDER_PATH = path.join(__dirname, '..', 'js', 'modules', 'problems', 'problem-render.js');
const PROBLEMS_CSS_PATH = path.join(__dirname, '..', 'css', 'problems.css');

const probRenderCode = fs.readFileSync(PROB_RENDER_PATH, 'utf8');
const problemsCssCode = fs.readFileSync(PROBLEMS_CSS_PATH, 'utf8');

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

console.log('Running no-solution indicator integrity tests...\n');

runTest('css/problems.css defines .no-solution-badge and .no-solution-warning', () => {
    assert(problemsCssCode.includes('.no-solution-badge'), 'Should define .no-solution-badge CSS rule');
    assert(problemsCssCode.includes('.no-solution-warning'), 'Should define .no-solution-warning CSS rule');
});

runTest('problem-render.js buildCardHtml detects missing solutions and renders indicator', () => {
    assert(probRenderCode.includes('hasSolutions'), 'Should check hasSolutions condition');
    assert(probRenderCode.includes('no-solution-badge'), 'Should render no-solution-badge when solutions are empty');
    assert(probRenderCode.includes('no-solution-warning'), 'Should render no-solution-warning when solutions are empty');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
