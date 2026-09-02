import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fs = require('fs');

const ROOTS = ['js', 'css', 'scripts', 'tests'];
const ROOT_FILES = ['index.html', 'manifest.json', 'sw.js'];
const EXTS = new Set(['.js', '.html', '.css', '.json']);
const MOJIBAKE = /[ÃÂ][\x80-\xBF\xA0-\xFF]|â€|ï¿½|\uFFFD/;

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

function* walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) yield* walk(full);
        else if (EXTS.has(path.extname(entry.name))) yield full;
    }
}

let bomFound = 0;
let mojibakeFound = [];
let totalFiles = 0;

for (const root of ROOTS) {
    const abs = path.join(__dirname, '..', root);
    for (const file of walk(abs)) {
        if (file === __filename) continue;
        totalFiles++;
        const buf = fs.readFileSync(file);
        if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) bomFound++;
        const text = buf.toString('utf8');
        if (MOJIBAKE.test(text)) mojibakeFound.push(file);
    }
}

for (const name of ROOT_FILES) {
    const file = path.join(__dirname, '..', name);
    if (!fs.existsSync(file)) continue;
    totalFiles++;
    const buf = fs.readFileSync(file);
    if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) bomFound++;
    const text = buf.toString('utf8');
    if (MOJIBAKE.test(text)) mojibakeFound.push(file);
}

assert(bomFound === 0, `Nenhum arquivo com BOM UTF-8 em fontes (encontrados: ${bomFound})`);
assert(mojibakeFound.length === 0, `Nenhum mojibake em ${totalFiles} arquivos .js/.html/.css/.json/.md`);
if (mojibakeFound.length) {
    console.error('\nArquivos com suspeita de mojibake:');
    mojibakeFound.slice(0, 10).forEach((f) => console.error('  - ' + f));
}

console.log(`\nUTF-8 guard: ${passed} ok, ${failed} falharam (${totalFiles} arquivos escaneados)`);
process.exit(failed === 0 ? 0 : 1);
