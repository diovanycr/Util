import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed += 1;
        console.log(`  ✓ ${message}`);
    } else {
        failed += 1;
        console.error(`  ✗ ${message}`);
    }
}

console.log('Running quality gate tests...\n');

for (const script of ['typecheck', 'build', 'validate:port-denylist', 'test', 'test:coverage']) {
    assert(Boolean(packageJson.scripts[script]), `Should define the ${script} script`);
}

for (const file of ['scripts/typecheck.js', 'scripts/build-check.js', 'scripts/validate-port-denylist.js']) {
    const result = spawnSync(process.execPath, [file], { encoding: 'utf8' });
    assert(result.status === 0, `${file} should pass for the current project`);
}

const ciWorkflowPath = new URL('../.github/workflows/ci.yml', import.meta.url);
const ciWorkflowContent = readFileSync(ciWorkflowPath, 'utf8');

for (const script of ['validate:port-denylist', 'typecheck', 'build']) {
    assert(ciWorkflowContent.includes(`npm run ${script}`), `.github/workflows/ci.yml should explicitly execute npm run ${script}`);
}
assert(ciWorkflowContent.includes('upload-artifact'), '.github/workflows/ci.yml should upload test artifacts');

const runnerPath = new URL('../tests/run-all.js', import.meta.url);
const runnerContent = readFileSync(runnerPath, 'utf8');
assert(runnerContent.includes('readdirSync'), 'tests/run-all.js should use dynamic test discovery');
assert(runnerContent.includes('junit.xml'), 'tests/run-all.js should generate junit.xml report');
assert(runnerContent.includes('failures'), 'tests/run-all.js should generate failure artifact logs');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

