import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fs = require('fs');

const INDEX = path.join(__dirname, '..', 'index.html');
const SW = path.join(__dirname, '..', 'sw.js');

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

const html = fs.readFileSync(INDEX, 'utf8');
const sw = fs.readFileSync(SW, 'utf8');

const cspMatch = html.match(/Content-Security-Policy[^>]*content="([^"]+)"/);
assert(!!cspMatch, 'index.html declara Content-Security-Policy');
const csp = cspMatch ? cspMatch[1] : '';

const scriptSrcMatch = csp.match(/script-src\s+([^;]+)/);
assert(!!scriptSrcMatch, 'CSP define script-src');
const scriptSrc = scriptSrcMatch ? scriptSrcMatch[1] : '';

assert(!scriptSrc.includes("'unsafe-inline'"), "script-src nao permite 'unsafe-inline'");
assert(!scriptSrc.includes("'unsafe-eval'"), "script-src nao permite 'unsafe-eval'");
assert(scriptSrc.includes("'self'"), "script-src permite 'self'");

const styleSrcMatch = csp.match(/style-src\s+([^;]+)/);
const styleSrc = styleSrcMatch ? styleSrcMatch[1] : '';
assert(styleSrc.includes("'self'"), 'style-src permite self (legado)');
assert(styleSrc.includes("'unsafe-inline'"), 'style-src ainda permite unsafe-inline (migrar depois)');

const inlineScripts = (html.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g) || [])
    .filter(s => !/src=["'][^"']+["']/.test(s));
assert(inlineScripts.length === 0, `index.html nao contem <script> inline (encontrados: ${inlineScripts.length})`);

const inlineHandlers = (html.match(/\son\w+="[^"]*"/g) || []);
assert(inlineHandlers.length === 0, `index.html nao tem handlers onclick/onerror/etc inline (encontrados: ${inlineHandlers.length})`);

function scanJs(dir) {
    const out = [];
    if (!fs.existsSync(dir)) return out;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) out.push(...scanJs(full));
        else if (full.endsWith('.js')) out.push(full);
    }
    return out;
}

const jsDir = path.join(__dirname, '..', 'js');
const offenders = [];
for (const file of scanJs(jsDir)) {
    const txt = fs.readFileSync(file, 'utf8');
    const matches = txt.match(/\bon\w+="[^"]*"/g) || [];
    if (matches.length) offenders.push({ file, matches });
}
assert(offenders.length === 0, `js/ sem handlers inline em strings (offenders: ${offenders.length})`);
if (offenders.length) offenders.slice(0, 5).forEach(o => console.error(`    - ${path.relative(path.join(__dirname, '..'), o.file)}: ${o.matches.join(', ')}`));

assert(fs.existsSync(path.join(__dirname, '..', 'js', 'boot', 'theme-fouc.js')), 'js/boot/theme-fouc.js existe');
assert(fs.existsSync(path.join(__dirname, '..', 'js', 'boot', 'sw-register.js')), 'js/boot/sw-register.js existe');
assert(sw.includes('js/boot/theme-fouc.js'), 'sw.js pre-cacheia theme-fouc.js');
assert(sw.includes('js/boot/sw-register.js'), 'sw.js pre-cacheia sw-register.js');

console.log(`\nCSP guard: ${passed} ok, ${failed} falharam`);
process.exit(failed === 0 ? 0 : 1);
