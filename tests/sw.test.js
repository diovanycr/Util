import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fs = require('fs');

const SW_PATH = path.join(__dirname, '..', 'sw.js');
const swCode = fs.readFileSync(SW_PATH, 'utf8');

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

console.log('Running Service Worker (sw.js) pre-cache integrity tests...\n');

runTest('sw.js exists and defines CACHE_NAME', () => {
    assert(swCode.includes("const CACHE_NAME ="), 'Should define CACHE_NAME');
});

runTest('all pre-cached files in sw.js exist on disk', () => {
    const regex = /'\.\/([^']+)'/g;
    let match;
    const files = [];
    while ((match = regex.exec(swCode)) !== null) {
        files.push(match[1]);
    }

    assert(files.length > 0, `Found ${files.length} files in pre-cache list`);

    const missingFiles = [];
    files.forEach(fileRel => {
        const fullPath = path.join(__dirname, '..', fileRel);
        if (!fs.existsSync(fullPath)) {
            missingFiles.push(fileRel);
        }
    });

    assert(
        missingFiles.length === 0,
        missingFiles.length === 0
            ? `All ${files.length} pre-cached files exist on disk`
            : `Missing ${missingFiles.length} file(s): ${missingFiles.join(', ')}`
    );
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
