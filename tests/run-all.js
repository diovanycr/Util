import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const args = process.argv.slice(2);
const isCoverage = args.includes('--coverage');
const timeoutArg = args.find(a => a.startsWith('--timeout='));
const defaultTimeout = timeoutArg ? parseInt(timeoutArg.split('=')[1], 10) : (parseInt(process.env.TEST_TIMEOUT, 10) || 30000);

const reportsDir = path.join(projectRoot, 'reports');
const failuresDir = path.join(reportsDir, 'failures');
const coverageDir = path.join(reportsDir, 'coverage');

fs.mkdirSync(reportsDir, { recursive: true });

if (isCoverage) {
    fs.mkdirSync(coverageDir, { recursive: true });
}

// 1. Auto-descoberta dinâmica de testes
const testFiles = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.test.js') && file !== 'run-all.js')
    .sort();

console.log(`⚡ Executando suíte unificada de testes do PainelAtende (${testFiles.length} arquivos descobertos)...\n`);

let totalPassed = 0;
let totalFailed = 0;
let totalErrors = 0;
/** @type {Array<{file: string, success: boolean, durationMs: number, reason?: string, output?: string}>} */
const results = [];
const suiteStart = Date.now();

/**
 * Escapes special XML characters.
 * @param {string} unsafe
 * @returns {string}
 */
function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

for (const file of testFiles) {
    const filePath = path.join(__dirname, file);
    const childEnv = { ...process.env };
    if (isCoverage) {
        childEnv.NODE_V8_COVERAGE = coverageDir;
    }

    const testStart = Date.now();
    const result = spawnSync(process.execPath, [filePath], {
        cwd: projectRoot,
        env: childEnv,
        encoding: 'utf8',
        timeout: defaultTimeout
    });
    const durationMs = Date.now() - testStart;

    const childError = /** @type {any} */ (result.error);
    const isTimeout = Boolean(childError && (childError.code === 'ETIMEDOUT' || (childError.message && childError.message.includes('ETIMEDOUT'))));
    const isSuccess = !isTimeout && result.status === 0 && !result.error;

    if (result.stdout) {
        process.stdout.write(result.stdout);
    }
    if (result.stderr) {
        process.stderr.write(result.stderr);
    }

    if (isSuccess) {
        totalPassed++;
        results.push({ file, success: true, durationMs });
        console.log(`✓ ${file} (${durationMs}ms)\n`);
    } else {
        totalFailed++;
        if (isTimeout) totalErrors++;
        
        const failureReason = isTimeout 
            ? `Timeout excedido (${defaultTimeout}ms)` 
            : (childError ? childError.message : `Código de saída: ${result.status}`);

        console.error(`\n❌ Falha detectada no arquivo de teste: ${file} - ${failureReason}\n`);

        // Geração de artefato de falha
        fs.mkdirSync(failuresDir, { recursive: true });
        const safeName = file.replace(/\.test\.js$/, '');
        const failureLogPath = path.join(failuresDir, `${safeName}-${Date.now()}.log`);
        const logContent = [
            '===================================================================',
            'PainelAtende Test Failure Report',
            `File: ${file}`,
            `Timestamp: ${new Date().toISOString()}`,
            `Duration: ${durationMs}ms`,
            `Exit Code: ${result.status}`,
            `Signal: ${result.signal || 'N/A'}`,
            `Error: ${failureReason}`,
            '===================================================================',
            '--- STDOUT ---',
            result.stdout || '(none)',
            '--- STDERR ---',
            result.stderr || '(none)'
        ].join('\n');

        fs.writeFileSync(failureLogPath, logContent, 'utf8');

        results.push({
            file,
            success: false,
            durationMs,
            reason: failureReason,
            output: (result.stdout || '') + '\n' + (result.stderr || '')
        });
    }
}

const suiteDuration = Date.now() - suiteStart;

// 2. Geração do Relatório JUnit XML
const testCasesXml = results.map(r => {
    const name = escapeXml(r.file);
    const classname = `tests.${escapeXml(r.file.replace(/\.test\.js$/, ''))}`;
    const timeSec = (r.durationMs / 1000).toFixed(3);

    if (r.success) {
        return `    <testcase name="${name}" classname="${classname}" time="${timeSec}"/>`;
    } else {
        const failureMsg = escapeXml(r.reason);
        const detail = escapeXml(r.output || r.reason);
        return `    <testcase name="${name}" classname="${classname}" time="${timeSec}">
      <failure message="${failureMsg}">${detail}</failure>
    </testcase>`;
    }
}).join('\n');

const junitXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="PainelAtende Test Suite" tests="${testFiles.length}" failures="${totalFailed}" errors="${totalErrors}" time="${(suiteDuration / 1000).toFixed(3)}">
  <testsuite name="All Tests" tests="${testFiles.length}" failures="${totalFailed}" errors="${totalErrors}" time="${(suiteDuration / 1000).toFixed(3)}">
${testCasesXml}
  </testsuite>
</testsuites>
`;

const junitPath = path.join(reportsDir, 'junit.xml');
fs.writeFileSync(junitPath, junitXml, 'utf8');
console.log(`\n📊 Relatório JUnit XML gerado em: ${path.relative(projectRoot, junitPath)}`);

if (totalFailed > 0) {
    console.error(`❌ Suíte de testes finalizou com ${totalFailed} falha(s).`);
    process.exit(1);
} else {
    console.log(`✅ Todos os ${testFiles.length} testes passaram com sucesso! (${(suiteDuration / 1000).toFixed(2)}s)`);
    process.exit(0);
}
