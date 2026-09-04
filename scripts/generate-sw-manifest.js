#!/usr/bin/env node
/**
 * generate-sw-manifest.js
 *
 * Varre css/, js/ e a raiz do projeto para montar a lista de assets que o
 * Service Worker deve pre-cachear. Computa um SHA-256 parcial (primeiros 8 KB)
 * de cada arquivo para gerar o content hash individual e um hash global que
 * é usado como versão do cache.
 *
 * Saída: sw-manifest.json  (na raiz do projeto)
 * Formato:
 *   {
 *     "version": "<sha256-global-truncado>",
 *     "generatedAt": "<ISO timestamp>",
 *     "files": ["./css/base.css", "./js/app.js", ...]
 *   }
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Raiz do projeto (um nível acima de scripts/) */
const ROOT = join(__dirname, '..');

/** Extensões cacheáveis */
const CACHEABLE_EXT = new Set(['.css', '.js', '.html', '.json', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2', '.ttf']);

/** Diretórios a varrer recursivamente */
const SCAN_DIRS = ['css', 'js'];

/** Arquivos da raiz a incluir explicitamente */
const ROOT_FILES = ['index.html', 'manifest.json'];

/** Padrões de exclusão (strings contidas no caminho relativo) */
const EXCLUDES = [
    'node_modules',
    '.git',
    'sw-manifest.json',   // evita referência circular
    'sw.js',              // o SW em si não entra no seu próprio pre-cache
    'backups',
    'reports',
];

/**
 * Retorna todos os arquivos sob um diretório, recursivamente.
 * @param {string} dir  Caminho absoluto
 * @returns {string[]}  Caminhos absolutos
 */
function walk(dir) {
    /** @type {string[]} */
    const results = [];
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch {
        return results; // diretório não existe — ignora silenciosamente
    }
    for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...walk(full));
        } else if (entry.isFile()) {
            results.push(full);
        }
    }
    return results;
}

/**
 * Computa SHA-256 dos primeiros `limit` bytes do arquivo.
 * @param {string} filePath
 * @param {number} [limit=8192]
 * @returns {string}  Hex digest truncado a 8 chars
 */
function fileHash(filePath, limit = 8192) {
    let buf;
    try {
        const stat = statSync(filePath);
        const fd = readFileSync(filePath);
        buf = fd.length <= limit ? fd : fd.subarray(0, limit);
    } catch {
        return '00000000';
    }
    return createHash('sha256').update(buf).digest('hex').slice(0, 8);
}

/**
 * Converte caminho absoluto para caminho relativo no estilo `./css/base.css`
 * @param {string} abs
 * @returns {string}
 */
function toRelative(abs) {
    return './' + relative(ROOT, abs).split(sep).join('/');
}

// ── Coleta de arquivos ────────────────────────────────────────────────────────

/** @type {string[]} Caminhos absolutos */
const allFiles = [];

for (const dir of SCAN_DIRS) {
    allFiles.push(...walk(join(ROOT, dir)));
}

for (const f of ROOT_FILES) {
    const abs = join(ROOT, f);
    try { statSync(abs); allFiles.push(abs); } catch { /* ignora */ }
}

// Filtra por extensão e exclusões
const filtered = allFiles.filter((abs) => {
    const rel = toRelative(abs);
    const ext = path.extname(abs).toLowerCase();
    if (!CACHEABLE_EXT.has(ext)) return false;
    if (EXCLUDES.some((ex) => rel.includes(ex))) return false;
    return true;
});

// Ordena para saída determinística
filtered.sort();

// ── Hashing ───────────────────────────────────────────────────────────────────

/** @type {string[]} Arquivos relativos (sem query string — o SW resolve na instalação) */
const files = filtered.map((abs) => toRelative(abs));

// Hash global baseado nos hashes individuais (XOR + SHA-256 final)
const globalHasher = createHash('sha256');
for (const abs of filtered) {
    globalHasher.update(fileHash(abs));
}
const version = globalHasher.digest('hex').slice(0, 12);

// ── Saída ─────────────────────────────────────────────────────────────────────

const manifest = {
    version,
    generatedAt: new Date().toISOString(),
    files,
};

const outPath = join(ROOT, 'sw-manifest.json');
writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log(`[generate-sw-manifest] version=${version}  files=${files.length}  → sw-manifest.json`);
