import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOTS = ['js', 'scripts', 'tests', 'functions'];
const ROOT_FILES = ['sw.js'];

function collectJavaScriptFiles(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const filePath = join(directory, entry.name);
        if (entry.isDirectory()) return collectJavaScriptFiles(filePath);
        return entry.isFile() && entry.name.endsWith('.js') ? [filePath] : [];
    });
}

const files = [...ROOTS.flatMap(collectJavaScriptFiles), ...ROOT_FILES];
let failures = 0;

for (const file of files) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status === 0) continue;

    failures += 1;
    process.stderr.write(`Syntax check failed: ${file}\n${result.stderr}`);
}

if (failures > 0) process.exit(1);
console.log(`Syntax check passed for ${files.length} JavaScript files.`);

// --- TypeScript contract check (tsc --noEmit via tsconfig.json) ---
console.log('\nRunning TypeScript contract check (tsc --noEmit)...');
const tscBin = join('node_modules', 'typescript', 'bin', 'tsc');
const tscResult = spawnSync(process.execPath, [tscBin, '--noEmit'], {
    encoding: 'utf8',
    stdio: 'inherit'
});

if (tscResult.status !== 0) {
    process.stderr.write('TypeScript contract check failed.\n');
    process.exit(1);
}
console.log('TypeScript contract check passed.');
