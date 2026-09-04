import { spawnSync } from 'node:child_process';

/** @type {Array<[string, string[]]>} */
const checks = [
    [process.execPath, ['scripts/generate-sw-manifest.js']],
    [process.execPath, ['scripts/typecheck.js']],
    [process.execPath, ['tests/sw.test.js']],
];

for (const [command, args] of checks) {
    const result = spawnSync(command, args, { stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log('Static build verification passed.');
