import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fs = require('fs');

const INDEX_PATH = path.join(__dirname, '..', 'index.html');
const indexHtml  = fs.readFileSync(INDEX_PATH, 'utf8');

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

console.log('Running HTML5 Landmarks & Accessibility tests...\n');

runTest('index.html uses <main> element for main content container with tabindex="-1"', () => {
    assert(indexHtml.includes('<main id="app"'), 'Should define <main id="app"> container');
    assert(indexHtml.includes('tabindex="-1"'), '<main id="app"> should have tabindex="-1" for skip-link focus navigation');
    assert(indexHtml.includes('</main>'), 'Should close </main> tag');
});

runTest('index.html uses <header> element for top toolbar section', () => {
    assert(indexHtml.includes('<header class="header">'), 'Should define <header class="header">');
    assert(indexHtml.includes('</header>'), 'Should close </header> tag');
});

runTest('index.html uses <nav> element for primary navigation tabs', () => {
    assert(indexHtml.includes('<nav aria-label='), 'Should define <nav> with aria-label');
    assert(indexHtml.includes('</nav>'), 'Should close </nav> tag');
});

runTest('index.html defines skip-link pointing to #app', () => {
    assert(indexHtml.includes('href="#app"'), 'skip-link should point to #app');
    assert(indexHtml.includes('class="skip-link"'), 'Should define skip-link element');
});

runTest('index.html uses role="search" on search containers', () => {
    assert(indexHtml.includes('role="search"'), 'Should define role="search" attribute');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
