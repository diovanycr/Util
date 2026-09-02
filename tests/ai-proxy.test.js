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

const fnSrc = fs.readFileSync(path.join(__dirname, '..', 'functions', 'index.js'), 'utf8');
assert(fnSrc.includes('exports.aiProxy'), 'functions expoe aiProxy callable');
assert(fnSrc.includes('defineSecret'), 'functions usa defineSecret para API keys');
assert(/GEMINI_API_KEY|OPENAI_API_KEY/.test(fnSrc), 'functions define secrets para Gemini e OpenAI');
assert(fnSrc.includes('rateLimit') || fnSrc.includes('rate'), 'functions implementa rate limiting');
assert(/req\.auth/.test(fnSrc), 'functions exigem req.auth (autenticado)');
assert(!fnSrc.includes('apiKey: ctx.config.apiKey') && !fnSrc.includes('Bearer ${ctx.config.apiKey'), 'cliente nao envia apiKey nas chamadas');

const searchSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'tools', 'futura-widget', 'futura-widget-search.js'), 'utf8');
assert(!searchSrc.includes('generativelanguage.googleapis.com'), 'cliente nao chama Gemini direto');
assert(!searchSrc.includes('api.openai.com'), 'cliente nao chama OpenAI direto');
assert(!searchSrc.includes('ctx.config.apiKey'), 'cliente nao usa apiKey local');
assert(searchSrc.includes('httpsCallable') || searchSrc.includes('aiProxyFn'), 'cliente usa callable aiProxy');

const modalSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'tools', 'futura-widget', 'futura-widget-modal.js'), 'utf8');
assert(!/fw-inp-apikey/.test(modalSrc), 'modal de configuracao nao tem campo de API key');
assert(!/futura-apikey/.test(modalSrc), 'modal nao grava futura-apikey no localStorage');

const configSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'tools', 'futura-widget', 'futura-widget-config.js'), 'utf8');
assert(configSrc.includes("removeItem(lsKey('futura-apikey')"), 'config limpa futura-apikey legado do localStorage');
assert(!configSrc.includes('apiKey: localStorage.getItem'), 'createConfig nao le apiKey do localStorage');

const fbSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'core', 'firebase.js'), 'utf8');
assert(fbSrc.includes('firebase-functions.js'), 'firebase.js importa firebase-functions SDK');
assert(fbSrc.includes('export const functions'), 'firebase.js expoe functions');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(indexHtml.includes('cloudfunctions.net'), 'CSP permite cloudfunctions.net');

console.log(`\nAI proxy guard: ${passed} ok, ${failed} falharam`);
process.exit(failed === 0 ? 0 : 1);
