/**
 * sw.test.js
 *
 * Testes de integridade estrutural do Service Worker (sw.js):
 *  - Lê sw-manifest.json para validar a lista de assets (não mais hardcoded)
 *  - Garante fluxo de atualização seguro (sem skipWaiting automático no install)
 *  - Verifica tratamento da mensagem SKIP_WAITING
 */

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fs = require('fs');

const SW_PATH = path.join(__dirname, '..', 'sw.js');
const MANIFEST_PATH = path.join(__dirname, '..', 'sw-manifest.json');
const ROOT = path.join(__dirname, '..');

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

console.log('Running Service Worker (sw.js) structural tests...\n');

// ── Teste 1: define CACHE_PREFIX (substitui CACHE_NAME estático) ──────────────
runTest('sw.js define CACHE_PREFIX', () => {
    assert(swCode.includes('CACHE_PREFIX'), 'CACHE_PREFIX deve estar definido');
});

// ── Teste 2: NÃO chama skipWaiting no handler install ─────────────────────────
runTest('install handler NÃO chama skipWaiting automaticamente', () => {
    // Detecta se self.skipWaiting() aparece dentro do bloco install
    // (a estratégia correta é chamar apenas via mensagem SKIP_WAITING)
    const installBlock = swCode.match(/addEventListener\s*\(\s*['"]install['"]\s*,[\s\S]*?\}\s*\)/)?.[0] ?? '';
    const hasSkipInInstall = installBlock.includes('skipWaiting');
    assert(!hasSkipInInstall, 'skipWaiting não deve ser chamado no handler install');
});

// ── Teste 3: trata mensagem SKIP_WAITING ─────────────────────────────────────
runTest('sw.js responde à mensagem SKIP_WAITING', () => {
    assert(swCode.includes("'SKIP_WAITING'") || swCode.includes('"SKIP_WAITING"'), 'Deve reagir a SKIP_WAITING');
    assert(swCode.includes('self.skipWaiting()'), 'Deve chamar skipWaiting() ao receber a mensagem');
});

// ── Teste 4: lê sw-manifest.json no install (sem lista hardcoded) ─────────────
runTest('sw.js usa sw-manifest.json para pre-cache (sem lista hardcoded)', () => {
    assert(swCode.includes('sw-manifest.json'), 'Deve referenciar sw-manifest.json');
    // Garante que não há array hardcoded de arquivos (>10 strings ./css/ ou ./js/)
    const hardcodedPaths = (swCode.match(/'\.\/css\//g) || []).length +
                           (swCode.match(/'\.\/js\//g) || []).length;
    assert(hardcodedPaths === 0, `Não deve ter caminhos hardcoded (encontrado: ${hardcodedPaths})`);
});

// ── Teste 5: activate limpa caches antigos ────────────────────────────────────
runTest('activate handler limpa caches com prefixo antigo', () => {
    assert(swCode.includes('caches.delete'), 'Deve deletar caches antigos no activate');
    assert(swCode.includes('CACHE_PREFIX'), 'Usa CACHE_PREFIX para filtrar caches a deletar');
});

// ── Teste 6: todos os arquivos do manifesto existem em disco ─────────────────
runTest('todos os arquivos do sw-manifest.json existem em disco', () => {
    if (!fs.existsSync(MANIFEST_PATH)) {
        assert(false, 'sw-manifest.json não existe — rode npm run generate:sw');
        return;
    }

    let manifest;
    try {
        manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    } catch (e) {
        assert(false, `sw-manifest.json inválido: ${e.message}`);
        return;
    }

    if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
        assert(false, 'sw-manifest.json sem arquivos');
        return;
    }

    const missing = manifest.files.filter((rel) => {
        const clean = rel.split('?')[0];
        const abs = path.join(ROOT, clean.replace(/^\.\//, ''));
        return !fs.existsSync(abs);
    });

    assert(
        missing.length === 0,
        missing.length === 0
            ? `Todos os ${manifest.files.length} arquivos do manifesto existem`
            : `Faltando ${missing.length}: ${missing.join(', ')}`
    );
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
