const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKLOG_PATH = path.join(__dirname, '..', 'backlog.md');
const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');
const SCRIPT = path.join(__dirname, '..', 'scripts', 'backlog.js');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed++;
        console.log(`  ✓ ${message}`);
    } else {
        failed++;
        console.error(`  ✗ ${message}`);
    }
}

function backup() {
    return {
        backlog: fs.readFileSync(BACKLOG_PATH, 'utf8'),
        changelog: fs.existsSync(CHANGELOG_PATH) ? fs.readFileSync(CHANGELOG_PATH, 'utf8') : null,
    };
}

function restore(b) {
    fs.writeFileSync(BACKLOG_PATH, b.backlog, 'utf8');
    if (b.changelog) {
        fs.writeFileSync(CHANGELOG_PATH, b.changelog, 'utf8');
    } else if (fs.existsSync(CHANGELOG_PATH)) {
        fs.unlinkSync(CHANGELOG_PATH);
    }
}

function run(args) {
    return execSync(`node "${SCRIPT}" ${args}`, { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
}

console.log('Running backlog.js tests...\n');



// Test: getNextVersion starts at v1.0.0
console.log('Test: getNextVersion starts at v1.0.0');
{
    const b = backup();
    if (fs.existsSync(CHANGELOG_PATH)) fs.unlinkSync(CHANGELOG_PATH);
    const result = run('release v1.0.0');
    const content = fs.readFileSync(BACKLOG_PATH, 'utf8');
    assert(content.includes('### 📦 Release v1.0.0'), 'Should create v1.0.0 when no changelog exists');
    restore(b);
}

// Test: add command creates a task
console.log('Test: add command creates a task');
{
    const b = backup();
    run('add "Test task for audit" --size P --scope UI');
    const content = fs.readFileSync(BACKLOG_PATH, 'utf8');
    assert(content.includes('Test task for audit'), 'Should add task to backlog');
    assert(content.includes('[P]'), 'Should include size P');
    assert(content.includes('[UI]'), 'Should include scope UI');
    restore(b);
}

// Test: done command marks task as complete
console.log('Test: done command marks task as complete');
{
    const b = backup();
    run('add "Temp task to mark done" --size P --scope UI');
    run('done "Temp task to mark done"');
    const content = fs.readFileSync(BACKLOG_PATH, 'utf8');
    assert(content.includes('- [x] **Temp task to mark done**'), 'Should mark task as done');
    assert(!content.includes('- [ ] **Temp task to mark done**'), 'Should remove from pending');
    restore(b);
}

// Test: done command handles missing task
console.log('Test: done command handles missing task');
{
    const b = backup();
    try {
        run('done "Nonexistent task that does not exist"');
        assert(false, 'Should have exited with error');
    } catch (e) {
        assert(e.status !== 0, 'Should exit with non-zero status');
    }
    restore(b);
}

// Test: release command creates a release block
console.log('Test: release command creates a release block');
{
    const b = backup();
    run('release v2.0.0');
    const content = fs.readFileSync(BACKLOG_PATH, 'utf8');
    assert(content.includes('### 📦 Release v2.0.0'), 'Should create release block');
    restore(b);
}

// Test: add without title shows error
console.log('Test: add without title shows error');
{
    const b = backup();
    try {
        run('add');
        assert(false, 'Should have exited with error');
    } catch (e) {
        assert(e.status !== 0, 'Should exit with non-zero status');
    }
    restore(b);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);