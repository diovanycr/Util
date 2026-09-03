import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const Module = /** @type {any} */ (require('module'));
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (req, ...rest) {
    if (req === '../core/modal.js' || req.endsWith('/js/core/modal.js')) {
        return originalResolve.call(this, path.join(__dirname, '..', 'js', 'core', 'modal.js'), ...rest);
    }
    if (req === '../core/utils.js' || req.endsWith('/js/core/utils.js')) {
        return originalResolve.call(this, path.join(__dirname, '..', 'js', 'core', 'utils.js'), ...rest);
    }
    return originalResolve.call(this, req, ...rest);
};

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

const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'tools', 'apiTester.js'), 'utf8');

const validateMatch = src.match(/export function validateApiRequestUrl[\s\S]+?\n\}/);
assert(!!validateMatch, 'validateApiRequestUrl exportado');

const body = validateMatch ? validateMatch[0] : '';

function callValidate(rawUrl) {
    const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '::']);
    function isPrivate(host) {
        if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
        const p = host.split('.').map(Number);
        if (p.some(x => x < 0 || x > 255)) return true;
        return p[0] === 10 || p[0] === 127 ||
            (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
            (p[0] === 192 && p[1] === 168) ||
            (p[0] === 169 && p[1] === 254) ||
            (p[0] === 100 && p[1] >= 64 && p[1] <= 127);
    }
    if (!rawUrl) return { ok: false, reason: 'URL vazia.' };
    let u;
    try { u = new URL(rawUrl); } catch { return { ok: false, reason: 'URL malformada.' }; }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return { ok: false, reason: `Protocolo bloqueado (${u.protocol}).` };
    if (u.protocol === 'http:') return { ok: false, reason: 'HTTP (sem TLS) bloqueado.' };
    const h = u.hostname.toLowerCase();
    if (LOOPBACK_HOSTS.has(h)) return { ok: false, reason: `Loopback bloqueado (${h}).` };
    if (isPrivate(h)) return { ok: false, reason: `Endereco privado bloqueado (${h}).` };
    return { ok: true };
}

const cases = [
    { url: 'https://api.exemplo.com/v1/orders', ok: true, label: 'https publico' },
    { url: 'http://api.exemplo.com/v1/orders', ok: false, label: 'http sem TLS' },
    { url: 'https://localhost/secret', ok: false, label: 'localhost' },
    { url: 'https://127.0.0.1/x', ok: false, label: '127.0.0.1' },
    { url: 'https://10.0.0.1/x', ok: false, label: '10.0.0.0/8' },
    { url: 'https://192.168.1.1/x', ok: false, label: '192.168/16' },
    { url: 'https://172.16.0.1/x', ok: false, label: '172.16/12' },
    { url: 'https://172.15.0.1/x', ok: true, label: '172.15 fora do range privado' },
    { url: 'https://169.254.169.254/latest/meta-data/', ok: false, label: 'link-local AWS metadata' },
    { url: 'ftp://api.exemplo.com', ok: false, label: 'protocolo nao-http' },
    { url: 'javascript:alert(1)', ok: false, label: 'protocolo javascript:' },
    { url: 'nao-eh-url', ok: false, label: 'malformed' },
];

for (const c of cases) {
    const r = callValidate(c.url);
    assert(r.ok === c.ok, `${c.label} (${c.url}) -> ok=${r.ok} (esperado ${c.ok})`);
    if (!r.ok) assert(typeof r.reason === 'string' && r.reason.length > 0, `${c.label} retorna motivo`);
}

assert(!/\bon\w+="/.test(src), 'apiTester.js sem handlers inline em strings');
assert(src.includes('validateApiRequestUrl'), 'apiTester.js expoe validateApiRequestUrl');
assert(src.includes('openConfirmModal'), 'apiTester.js pede confirmacao antes de enviar metodos != GET');
assert(src.includes('_maskSensitiveHeaders') || /Authorization/i.test(src), 'apiTester.js tem helper de mascara de credenciais');

const sendMatch = src.match(/function _send\(container\)\s*{[\s\S]+?\n\}/);
assert(!!sendMatch, '_send() presente');
if (sendMatch) {
    const s = sendMatch[0];
    assert(s.includes('validateApiRequestUrl'), '_send chama validateApiRequestUrl');
    assert(s.includes('openConfirmModal'), '_send pede confirmacao via openConfirmModal');
}

console.log(`\nAPI Tester guard: ${passed} ok, ${failed} falharam`);
process.exit(failed === 0 ? 0 : 1);
