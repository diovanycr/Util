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

const root = path.join(__dirname, '..');

const functionsDir = path.join(root, 'functions');
assert(fs.existsSync(path.join(functionsDir, 'index.js')), 'functions/index.js existe');
assert(fs.existsSync(path.join(functionsDir, 'package.json')), 'functions/package.json existe');
assert(fs.existsSync(path.join(functionsDir, '.gitignore')), 'functions/.gitignore existe');

const fnPkg = JSON.parse(fs.readFileSync(path.join(functionsDir, 'package.json'), 'utf8'));
assert(fnPkg.engines && fnPkg.engines.node === '22', 'functions/package.json usa Node 22');
assert(fnPkg.dependencies && fnPkg.dependencies['firebase-admin'], 'functions depende de firebase-admin');
assert(fnPkg.dependencies && fnPkg.dependencies['firebase-functions'], 'functions depende de firebase-functions');

const fnSrc = fs.readFileSync(path.join(functionsDir, 'index.js'), 'utf8');
assert(fnSrc.includes('onSchedule'), 'functions/index.js exporta onSchedule');
assert(/schedule:\s*["']0 0 \* \* \*["']/.test(fnSrc), 'cron schedule 0 0 * * * (meia-noite)');
assert(/timeZone:\s*["']America\/Sao_Paulo["']/.test(fnSrc), 'timeZone America/Sao_Paulo');
assert(fnSrc.includes('copyCount'), 'reset zera copyCount');
assert(fnSrc.includes('auditReset'), 'reset escreve auditReset');
assert(fnSrc.includes('deleteUserAccount'), 'exporta deleteUserAccount');
assert(fnSrc.includes('adminDeleteUser'), 'exporta adminDeleteUser');
assert(fnSrc.includes('admin.auth().deleteUser'), 'remove usuario do Auth');

const adminSrc = fs.readFileSync(path.join(root, 'js', 'modules', 'admin.js'), 'utf8');
assert(adminSrc.includes('adminDeleteUser'), 'admin.js chama adminDeleteUser');

assert(fs.existsSync(path.join(root, 'firebase.json')), 'firebase.json existe');
const fb = JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'), 'utf8'));
assert(fb.firestore && fb.firestore.rules === 'firestore.rules', 'firebase.json aponta firestore.rules');
assert(Array.isArray(fb.functions) && fb.functions[0].runtime === 'nodejs22', 'functions runtime nodejs22');

assert(fs.existsSync(path.join(root, 'firestore.rules')), 'firestore.rules existe');
const rules = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');
assert(rules.includes('request.auth != null'), 'firestore.rules exige autenticacao');
assert(rules.includes('request.auth.uid == uid'), 'firestore.rules isola por uid');

const rankingSrc = fs.readFileSync(path.join(root, 'js', 'modules', 'ranking.js'), 'utf8');
assert(rankingSrc.includes('scheduleDailyReset'), 'ranking.js mantem scheduleDailyReset como fallback');
assert(rankingSrc.includes('BroadcastChannel'), 'ranking.js escuta BroadcastChannel para sincronia entre abas');

console.log(`\nCloud Functions guard: ${passed} ok, ${failed} falharam`);
process.exit(failed === 0 ? 0 : 1);
