import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fs = require('fs');

const INDEX_PATH = path.join(__dirname, '..', 'index.html');
const MODAL_PATH = path.join(__dirname, '..', 'js', 'core', 'modal.js');

const indexHtml = fs.readFileSync(INDEX_PATH, 'utf8');
const modalJs = fs.readFileSync(MODAL_PATH, 'utf8');

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

console.log('Running Modal Accessibility tests...\n');

runTest('index.html contains valid ARIA attributes on modal containers', () => {
    const modalIds = [
        'modalOverlay',
        'confirmModal',
        'exportFormatModal',
        'helpModal',
        'globalSearchModal',
        'deptModal',
        'aiAssistantModal'
    ];

    modalIds.forEach(id => {
        const hasModal = indexHtml.includes(`id="${id}"`);
        assert(hasModal, `HTML should define #${id}`);

        if (hasModal) {
            const hasRole = indexHtml.includes(`id="${id}"`) &&
                (indexHtml.includes(`id="${id}" class="modal-overlay hidden" role="dialog"`) ||
                 indexHtml.includes(`id="${id}" class="modal-overlay hidden" role="alertdialog"`));
            assert(hasRole, `#${id} should have role="dialog" or role="alertdialog"`);
            assert(indexHtml.includes(`id="${id}"`) && indexHtml.includes('aria-modal="true"'), `#${id} should specify aria-modal="true"`);
        }
    });
});

runTest('js/core/modal.js exports central modal controller functions', () => {
    assert(modalJs.includes('export function openModalContainer'), 'Should export openModalContainer');
    assert(modalJs.includes('export function closeModalContainer'), 'Should export closeModalContainer');
    assert(modalJs.includes('export function trapFocus'), 'Should export trapFocus');
    assert(modalJs.includes('export function getActiveModal'), 'Should export getActiveModal');
});

runTest('Module files use central modal accessibility functions', () => {
    const files = [
        'js/modules/help.js',
        'js/core/shortcuts.js',
        'js/modules/problems/departments.js',
        'js/modules/aiAssistant.js',
        'js/modules/messages.js'
    ];

    files.forEach(relPath => {
        const fullPath = path.join(__dirname, '..', relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        assert(
            content.includes('openModalContainer') || content.includes('closeModalContainer'),
            `${relPath} should import openModalContainer/closeModalContainer`
        );
    });
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
