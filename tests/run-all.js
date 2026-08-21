import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testFiles = [
    'backlog.test.js',
    'utils-dom.test.js',
    'modules.test.js',
    'utils.test.js',
    'xss.test.js',
    'sw.test.js',
    'duplication.test.js',
    'command-palette.test.js',
    'solution-status-filter.test.js',
    'no-solution-indicator.test.js',
    'message-inline-search.test.js'
];

console.log('⚡ Executando suíte unificada de testes do PainelAtende...\n');

let totalPassed = 0;
let totalFailed = 0;
let hasError = false;

for (const file of testFiles) {
    const filePath = path.join(__dirname, file);
    const result = spawnSync('node', [filePath], {
        stdio: 'inherit',
        encoding: 'utf8'
    });

    if (result.status !== 0) {
        hasError = true;
        console.error(`\n❌ Falha detectada no arquivo de teste: ${file}\n`);
    } else {
        console.log('');
    }
}

if (hasError) {
    console.error('❌ Suíte de testes finalizou com erros.');
    process.exit(1);
} else {
    console.log('✅ Todos os testes passaram com sucesso!');
    process.exit(0);
}
