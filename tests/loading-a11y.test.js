import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fs = require('fs');

const INDEX_PATH   = path.join(__dirname, '..', 'index.html');
const RETRY_PATH   = path.join(__dirname, '..', 'js', 'core', 'firebase-retry.js');
const ANNOUNCE_PATH = path.join(__dirname, '..', 'js', 'core', 'announce.js');
const UTILS_PATH   = path.join(__dirname, '..', 'js', 'core', 'utils.js');
const LOADER_PATH  = path.join(__dirname, '..', 'js', 'modules', 'messages', 'loader.js');
const TRASH_PATH   = path.join(__dirname, '..', 'js', 'modules', 'messages', 'trash.js');
const PROBLEMS_PATH = path.join(__dirname, '..', 'js', 'modules', 'problems.js');

const indexHtml    = fs.readFileSync(INDEX_PATH, 'utf8');
const retryJs      = fs.readFileSync(RETRY_PATH, 'utf8');
const announceJs   = fs.readFileSync(ANNOUNCE_PATH, 'utf8');
const utilsJs      = fs.readFileSync(UTILS_PATH, 'utf8');
const loaderJs     = fs.readFileSync(LOADER_PATH, 'utf8');
const trashJs      = fs.readFileSync(TRASH_PATH, 'utf8');
const problemsJs   = fs.readFileSync(PROBLEMS_PATH, 'utf8');

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
    try { fn(); } catch (e) { failed++; console.error(`  ✗ Threw: ${e.message}`); }
}

console.log('Running Loading Accessibility (aria-live / aria-busy) tests...\n');

runTest('index.html: #a11y-loading-announcer exists with correct ARIA', () => {
    assert(indexHtml.includes('id="a11y-loading-announcer"'), 'Should define #a11y-loading-announcer');
    assert(indexHtml.includes('aria-live="polite"'), '#a11y-loading-announcer should have aria-live="polite"');
    assert(indexHtml.includes('role="status"'), 'Should define at least one role="status"');
    assert(indexHtml.includes('aria-atomic="true"'), '#a11y-loading-announcer should have aria-atomic="true"');
});

runTest('index.html: #globalLoadingBar no longer has aria-hidden on the container', () => {
    // The container should NOT have aria-hidden="true" as its own attribute
    const barMatch = indexHtml.match(/id="globalLoadingBar"[^>]*/);
    assert(barMatch && !barMatch[0].includes('aria-hidden="true"'), '#globalLoadingBar container should not have aria-hidden="true"');
});

runTest('js/core/announce.js: exports announceLoading and announceComplete', () => {
    assert(announceJs.includes('export function announceLoading'), 'Should export announceLoading');
    assert(announceJs.includes('export function announceComplete'), 'Should export announceComplete');
    assert(announceJs.includes('aria-live'), 'Should create aria-live region');
    assert(announceJs.includes('role'), 'Should set role on announcer element');
});

runTest('js/core/firebase-retry.js: imports and calls announce functions', () => {
    assert(retryJs.includes("from './announce.js'"), 'Should import from announce.js');
    assert(retryJs.includes('announceLoading('), 'Should call announceLoading');
    assert(retryJs.includes('announceComplete('), 'Should call announceComplete');
    assert(retryJs.includes('aria-busy'), 'Should set aria-busy on #app');
});

runTest('js/core/utils.js: withButtonLoading sets aria-busy', () => {
    assert(utilsJs.includes("setAttribute('aria-busy', 'true')"), 'withButtonLoading should set aria-busy=true');
    assert(utilsJs.includes("removeAttribute('aria-busy')"), 'withButtonLoading should remove aria-busy on finish');
});

runTest('js/modules/messages/loader.js: applies aria-busy to msgList', () => {
    assert(loaderJs.includes("setAttribute('aria-busy', 'true')"), 'loadMessages should set aria-busy=true on list');
    assert(loaderJs.includes("removeAttribute('aria-busy')"), 'loadMessages should remove aria-busy in finally');
});

runTest('js/modules/messages/trash.js: applies aria-busy to trashList', () => {
    assert(trashJs.includes("setAttribute('aria-busy', 'true')"), 'loadTrash should set aria-busy=true on list');
    assert(trashJs.includes("removeAttribute('aria-busy')"), 'loadTrash should remove aria-busy in finally');
});

runTest('js/modules/problems.js: applies aria-busy to problemList', () => {
    assert(problemsJs.includes("setAttribute('aria-busy', 'true')"), 'loadProblems should set aria-busy=true on list');
    assert(problemsJs.includes("removeAttribute('aria-busy')"), 'loadProblems should remove aria-busy in finally');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
