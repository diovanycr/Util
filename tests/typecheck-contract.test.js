// tests/typecheck-contract.test.js
// Validates that tsconfig.json has checkJs: true and that `tsc --noEmit` passes.

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ ${message}`);
        passed++;
    } else {
        console.error(`  ❌ ${message}`);
        failed++;
    }
}

console.log('🔍 typecheck-contract.test.js — Validando configuração de contratos de tipos\n');

// AC 2: tsconfig.json deve existir e ter checkJs: true
let tsconfig;
try {
    const raw = readFileSync(path.join(ROOT, 'tsconfig.json'), 'utf8');
    tsconfig = JSON.parse(raw);
    assert(true, 'tsconfig.json existe e é JSON válido');
} catch {
    assert(false, 'tsconfig.json existe e é JSON válido');
    tsconfig = {};
}

assert(tsconfig?.compilerOptions?.checkJs === true, 'tsconfig.json possui checkJs: true');
assert(tsconfig?.compilerOptions?.allowJs === true, 'tsconfig.json possui allowJs: true');
assert(tsconfig?.compilerOptions?.noEmit === true, 'tsconfig.json possui noEmit: true');

// AC 5: tsc --noEmit deve passar sem erros
const tscBin = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
const result = spawnSync(process.execPath, [tscBin, '--noEmit'], {
    cwd: ROOT,
    encoding: 'utf8'
});

if (result.status === 0) {
    assert(true, 'tsc --noEmit passa sem erros de tipo');
} else {
    assert(false, `tsc --noEmit passou sem erros de tipo\n  Output:\n${result.stdout || result.stderr}`);
}

// AC 3: scripts/typecheck.js deve mencionar tsc --noEmit
let typecheckScript;
try {
    typecheckScript = readFileSync(path.join(ROOT, 'scripts', 'typecheck.js'), 'utf8');
    assert(true, 'scripts/typecheck.js existe');
} catch {
    assert(false, 'scripts/typecheck.js existe');
    typecheckScript = '';
}

assert(
    typecheckScript.includes('tsc') && typecheckScript.includes('noEmit'),
    'scripts/typecheck.js executa tsc --noEmit'
);

console.log(`\n${passed + failed} verificações: ${passed} passaram, ${failed} falharam.\n`);
if (failed > 0) process.exit(1);
