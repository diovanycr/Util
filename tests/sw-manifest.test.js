/**
 * sw-manifest.test.js
 *
 * Valida que sw-manifest.json existe, está bem formado e que todos os
 * arquivos listados nele existem em disco.
 *
 * Pré-requisito: `npm run generate:sw` (ou `npm run build`) já foi executado.
 */

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_PATH = path.join(__dirname, '..', 'sw-manifest.json');
const ROOT = path.join(__dirname, '..');

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

console.log('Running sw-manifest.json integrity tests...\n');

// ── Teste 1: arquivo existe ───────────────────────────────────────────────────
runTest('sw-manifest.json existe em disco', () => {
    assert(fs.existsSync(MANIFEST_PATH), 'sw-manifest.json deve existir (rode npm run generate:sw)');
});

if (!fs.existsSync(MANIFEST_PATH)) {
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
}

const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
let manifest;

// ── Teste 2: JSON válido ──────────────────────────────────────────────────────
runTest('sw-manifest.json é JSON válido', () => {
    try {
        manifest = JSON.parse(raw);
        assert(true, 'Parse sem erros');
    } catch (e) {
        assert(false, `JSON inválido: ${e.message}`);
    }
});

if (!manifest) {
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
}

// ── Teste 3: campos obrigatórios ──────────────────────────────────────────────
runTest('manifest tem campo "version" (string não vazia)', () => {
    assert(
        typeof manifest.version === 'string' && manifest.version.length > 0,
        `version="${manifest.version}"`
    );
});

runTest('manifest tem campo "files" (array não vazio)', () => {
    assert(
        Array.isArray(manifest.files) && manifest.files.length > 0,
        `files.length=${manifest.files?.length ?? 0}`
    );
});

runTest('manifest tem campo "generatedAt" (ISO timestamp)', () => {
    const ok = typeof manifest.generatedAt === 'string' && !isNaN(Date.parse(manifest.generatedAt));
    assert(ok, `generatedAt="${manifest.generatedAt}"`);
});

// ── Teste 4: todos os arquivos existem em disco ───────────────────────────────
runTest('todos os arquivos listados em "files" existem em disco', () => {
    if (!Array.isArray(manifest.files)) {
        assert(false, '"files" não é array');
        return;
    }

    const missing = manifest.files.filter((rel) => {
        // remove query string eventual (ex: ?v=abc12345)
        const clean = rel.split('?')[0];
        const abs = path.join(ROOT, clean.replace(/^\.\//, ''));
        return !fs.existsSync(abs);
    });

    assert(
        missing.length === 0,
        missing.length === 0
            ? `Todos os ${manifest.files.length} arquivos existem`
            : `Faltando ${missing.length} arquivo(s): ${missing.join(', ')}`
    );
});

// ── Teste 5: cobertura mínima ─────────────────────────────────────────────────
runTest('manifesto cobre CSS e JS do app', () => {
    const hasCss = manifest.files.some((f) => f.includes('/css/'));
    const hasJs  = manifest.files.some((f) => f.includes('/js/'));
    assert(hasCss, 'Ao menos um arquivo .css listado');
    assert(hasJs,  'Ao menos um arquivo .js listado');
});

// ── Teste 6: sw.js não está no manifesto (evita referência circular) ──────────
runTest('sw.js não está listado no manifesto', () => {
    const swIncluded = manifest.files.some((f) => f === './sw.js' || f.endsWith('/sw.js'));
    assert(!swIncluded, 'sw.js não deve pré-cachear a si mesmo');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
