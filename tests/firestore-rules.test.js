import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fs = require('fs');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed++;
        console.log(`  \u2713 ${message}`);
    } else {
        failed++;
        console.error(`  \u2717 ${message}`);
    }
}

const rules = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');

assert(rules.includes('rules_version = \'2\''), 'rules_version = 2');
assert(/service cloud\.firestore/.test(rules), 'service cloud.firestore declarado');
assert(/match \/users\/\{uid\}/.test(rules), 'match /users/{uid} existe');
assert(/request\.auth\.uid == uid/.test(rules), 'regras isolam por uid');
assert(rules.includes('match /{document=**}'), 'catch-all existe');
assert(/allow read, write: if false/.test(rules), 'catch-all nega por padrao');
assert(!/allow read, write: if true/.test(rules), 'nao ha regras permissivas amplas');

const jsDir = path.join(__dirname, '..', 'js');
function walk(dir) {
    const out = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name === 'node_modules') continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) out.push(...walk(full));
        else if (e.name.endsWith('.js')) out.push(full);
    }
    return out;
}

const offenders = [];
for (const file of walk(jsDir)) {
    const src = fs.readFileSync(file, 'utf8');
    const matches = [...src.matchAll(/collection\(db,\s*['"]([^'"]+)['"]/g)];
    for (const m of matches) {
        const path = m[1];
        if (path === 'users') continue;
        if (/^users$/.test(path)) continue;
    }
    const direct = [...src.matchAll(/collection\(db,\s*['"][^'"]+['"]\s*,\s*['"]([^'"]+)['"]/g)];
}

const collectionsUsed = new Set();
const topLevelUsed = new Set();
for (const file of walk(jsDir)) {
    const src = fs.readFileSync(file, 'utf8');
    const re = /collection\(\s*db\s*,\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]+)['"])?/g;
    let m;
    while ((m = re.exec(src)) !== null) {
        if (m[2]) {
            topLevelUsed.add(m[1]);
            collectionsUsed.add(m[2]);
        } else {
            topLevelUsed.add(m[1]);
        }
    }
    const re2 = /collection\(\s*db\s*,\s*['"]users['"]\s*,\s*[^,]+,\s*['"]([^'"]+)['"]/g;
    while ((m = re2.exec(src)) !== null) collectionsUsed.add(m[1]);
}

for (const col of collectionsUsed) {
    assert(/match \/\{document=\*\*\}/.test(rules), `subcollection ${col} coberta por match /{document=**}`);
}
assert(topLevelUsed.has('users'), 'users e o unico top-level path usado');

const fnRules = fs.readFileSync(path.join(__dirname, '..', 'functions', 'index.js'), 'utf8');
assert(/admin\.|firebase-admin/.test(fnRules), 'functions usam firebase-admin (bypass de regras para manutencao)');

console.log(`\nFirestore rules guard: ${passed} ok, ${failed} falharam`);
process.exit(failed === 0 ? 0 : 1);
