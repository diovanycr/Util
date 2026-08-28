import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fs = require('fs');

const INDEX_PATH = path.join(__dirname, '..', 'index.html');
const HELP_JS_PATH = path.join(__dirname, '..', 'js', 'modules', 'help.js');

const indexHtml = fs.readFileSync(INDEX_PATH, 'utf8');
const helpJs = fs.readFileSync(HELP_JS_PATH, 'utf8');

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

console.log('Running Help Contacts & Tutorial tests...\n');

runTest('index.html contains #help-tutorial and #help-contact panels', () => {
    assert(indexHtml.includes('id="help-tutorial"'), 'Should define #help-tutorial panel');
    assert(indexHtml.includes('id="help-contact"'), 'Should define #help-contact panel');
});

runTest('index.html contains actionable WhatsApp link', () => {
    assert(indexHtml.includes('href="https://wa.me/'), 'Should contain wa.me link');
    assert(indexHtml.includes('target="_blank"'), 'WhatsApp link should open in new tab');
    assert(indexHtml.includes('rel="noopener noreferrer"'), 'External link should have rel="noopener noreferrer"');
    assert(indexHtml.includes('fa-whatsapp'), 'Should use WhatsApp icon');
});

runTest('index.html contains actionable E-mail link and Working Hours', () => {
    assert(indexHtml.includes('href="mailto:suporte@painelatende.com.br"'), 'Should contain mailto: link for support email');
    assert(indexHtml.includes('Horário de Atendimento'), 'Should present Working Hours heading');
});

runTest('js/modules/help.js toggles help panels dynamically', () => {
    assert(helpJs.includes('switchHelpTab'), 'Should export or define switchHelpTab function');
    assert(helpJs.includes('help-panel'), 'Should query .help-panel elements');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
