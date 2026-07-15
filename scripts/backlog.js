/**
 * CLI Manager for backlog.md
 * Zero-dependency helper to add, complete, and bundle release tasks.
 *
 * Usage:
 *   node scripts/backlog.js add "Task description" --size M --scope UI
 *   node scripts/backlog.js done "Task description substring"
 *   node scripts/backlog.js release v1.2.0   (optional — changelog auto-increments)
 *   node scripts/backlog.js changelog         (auto-increments version, compiles CHANGELOG, cleans backlog)
 */

const fs = require('fs');
const path = require('path');

const BACKLOG_PATH   = path.join(__dirname, '../backlog.md');
const CHANGELOG_PATH = path.join(__dirname, '../CHANGELOG.md');

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

function printUsage() {
    console.log(`
\x1b[1m\x1b[34m📋 PainelAtende — Backlog CLI Manager\x1b[0m

Usage:
  node scripts/backlog.js add "<description>" [--size P|M|G] [--scope <name>]
  node scripts/backlog.js done "<id_or_title_snippet>"
  node scripts/backlog.js release "<version_tag>"    (manual release block)
  node scripts/backlog.js changelog                  (auto-version + compile + clean)
`);
}

function readBacklog() {
    if (!fs.existsSync(BACKLOG_PATH)) {
        console.error(`Error: backlog.md not found at ${BACKLOG_PATH}`);
        process.exit(1);
    }
    return fs.readFileSync(BACKLOG_PATH, 'utf8');
}

function writeBacklog(content) {
    fs.writeFileSync(BACKLOG_PATH, content, 'utf8');
    console.log('\x1b[32m✔ backlog.md updated successfully!\x1b[0m');
}

/**
 * Reads the latest version from CHANGELOG.md and returns the next patch.
 * e.g.  ## [v1.1.0]  →  "v1.1.1"
 * Falls back to "v1.0.0" when no previous version is found.
 */
function getNextVersion() {
    if (!fs.existsSync(CHANGELOG_PATH)) return 'v1.0.0';
    const text  = fs.readFileSync(CHANGELOG_PATH, 'utf8');
    const match = text.match(/##\s+\[v(\d+)\.(\d+)\.(\d+)\]/);
    if (!match) return 'v1.0.0';
    const [, major, minor, patch] = match.map(Number);
    return `v${major}.${minor}.${patch + 1}`;
}

/**
 * Ensures a "### 📦 Release vX.Y.Z" block exists under ## Feito.
 * If one is missing, auto-creates it with the next incremented version.
 * Returns the version string used (or null if a block already existed).
 */
function ensureReleaseBlock(lines) {
    if (lines.some(l => l.startsWith('### 📦 Release'))) return null;

    const version = getNextVersion();
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const header  = `### 📦 Release ${version} (${dateStr})`;

    const feitoIdx = lines.findIndex(l => l.startsWith('## Feito'));
    if (feitoIdx === -1) {
        console.error('Error: "## Feito" section not found in backlog.md');
        process.exit(1);
    }
    lines.splice(feitoIdx + 1, 0, '', header);
    console.log(`\x1b[36m→ Auto-created release block: ${header}\x1b[0m`);
    return version;
}

/**
 * Moves [x]-checked lines that sit loosely between ## Feito and
 * the first ### 📦 Release heading INTO that release heading.
 */
function adoptOrphanDoneTasks(lines) {
    const feitoIdx   = lines.findIndex(l => l.startsWith('## Feito'));
    const releaseIdx = lines.findIndex(l => l.startsWith('### 📦 Release'));
    if (feitoIdx === -1 || releaseIdx === -1 || releaseIdx < feitoIdx) return;

    const orphanIdxs = [];
    for (let i = feitoIdx + 1; i < releaseIdx; i++) {
        if (lines[i].includes('- [x]')) orphanIdxs.push(i);
    }
    if (orphanIdxs.length === 0) return;

    const orphans = orphanIdxs.map(i => lines[i]);
    for (let i = orphanIdxs.length - 1; i >= 0; i--) lines.splice(orphanIdxs[i], 1);

    const newReleaseIdx = lines.findIndex(l => l.startsWith('### 📦 Release'));
    if (newReleaseIdx !== -1) lines.splice(newReleaseIdx + 1, 0, ...orphans);
}

/**
 * Collects [x]-checked lines from sections BEFORE ## Feito
 * (e.g. "Em andamento", "Próximo") and moves them into the release block.
 * This handles the case where a user manually ticked checkboxes in the backlog.
 */
function pullDoneTasksFromPending(lines) {
    const feitoIdx   = lines.findIndex(l => l.startsWith('## Feito'));
    const releaseIdx = lines.findIndex(l => l.startsWith('### 📦 Release'));
    if (feitoIdx === -1 || releaseIdx === -1) return;

    const doneIdxs = [];
    for (let i = 0; i < feitoIdx; i++) {
        if (lines[i].includes('- [x]')) doneIdxs.push(i);
    }
    if (doneIdxs.length === 0) return;

    const done = doneIdxs.map(i => lines[i]);
    for (let i = doneIdxs.length - 1; i >= 0; i--) lines.splice(doneIdxs[i], 1);

    const newReleaseIdx = lines.findIndex(l => l.startsWith('### 📦 Release'));
    if (newReleaseIdx !== -1 && done.length > 0) lines.splice(newReleaseIdx + 1, 0, ...done);
}

// ────────────────────────────────────────────────────────────────────────────
// ROUTING
// ────────────────────────────────────────────────────────────────────────────

const args    = process.argv.slice(2);
const command = args[0];

if (!command) { printUsage(); process.exit(0); }

switch (command.toLowerCase()) {
    case 'add':       handleAdd(args.slice(1));       break;
    case 'done':      handleDone(args.slice(1));      break;
    case 'release':   handleRelease(args.slice(1));   break;
    case 'changelog': handleChangelog();              break;
    default:
        console.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
}

// ────────────────────────────────────────────────────────────────────────────
// COMMAND HANDLERS
// ────────────────────────────────────────────────────────────────────────────

function handleAdd(cmdArgs) {
    const title = cmdArgs[0];
    if (!title) { console.error('Error: Please specify the task description.'); process.exit(1); }

    let size  = 'M';
    let scope = 'Geral';
    for (let i = 1; i < cmdArgs.length; i++) {
        if (cmdArgs[i] === '--size'  && cmdArgs[i + 1]) size  = cmdArgs[i + 1].toUpperCase();
        if (cmdArgs[i] === '--scope' && cmdArgs[i + 1]) scope = cmdArgs[i + 1];
    }

    const taskLine = `- [ ] **${title}** \`[${size}]\` \`[${scope}]\``;
    let content = readBacklog();
    const nextHeaderIdx = content.indexOf('## Próximo');
    if (nextHeaderIdx === -1) { console.error('Error: "## Próximo" section not found.'); process.exit(1); }

    const nextLineIdx = content.indexOf('\n', nextHeaderIdx);
    let insertPos = nextLineIdx + 1;
    const remainder = content.slice(insertPos);

    if (remainder.match(/^\s*\*\(Aguardando/m)) {
        const placeholderStart = insertPos + remainder.indexOf('*(Aguardando');
        const placeholderEnd   = content.indexOf('\n', placeholderStart);
        content = content.slice(0, placeholderStart) + taskLine + content.slice(placeholderEnd);
    } else {
        content = content.slice(0, insertPos) + taskLine + '\n' + content.slice(insertPos);
    }

    writeBacklog(content);
    console.log(`Added: ${taskLine}`);
}

function handleDone(cmdArgs) {
    const target = cmdArgs[0];
    if (!target) { console.error('Error: Please specify a task ID or title snippet.'); process.exit(1); }

    let content = readBacklog();
    const lines = content.split('\n');
    let taskIdx = -1, taskLine = '';

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('- [ ]') && lines[i].toLowerCase().includes(target.toLowerCase())) {
            taskIdx = i; taskLine = lines[i]; break;
        }
    }

    if (taskIdx === -1) { console.error(`Error: No pending task matching "${target}"`); process.exit(1); }

    lines.splice(taskIdx, 1);

    // Insert placeholder if the section is now empty
    const prev = lines[taskIdx - 1] || '';
    const next = lines[taskIdx]     || '';
    if (prev.startsWith('##') && (next.startsWith('##') || next.startsWith('---') || next.trim() === '')) {
        lines.splice(taskIdx, 0, '*(Nenhum item pendente)*');
    }

    const doneLine      = taskLine.replace('- [ ]', '- [x]');
    const releaseIdx    = lines.findIndex(l => l.startsWith('### 📦 Release'));
    const feitoIdx      = lines.findIndex(l => l.startsWith('## Feito'));

    if (releaseIdx !== -1) {
        lines.splice(releaseIdx + 1, 0, doneLine);
    } else if (feitoIdx !== -1) {
        lines.splice(feitoIdx + 1, 0, doneLine);
    } else {
        console.error('Error: "## Feito" section not found.'); process.exit(1);
    }

    writeBacklog(lines.join('\n'));
    console.log(`Marked as done: ${doneLine}`);
}

function handleRelease(cmdArgs) {
    const version = cmdArgs[0];
    if (!version) { console.error('Error: Please specify the version tag (e.g. v1.2.0).'); process.exit(1); }

    const dateStr = new Date().toLocaleDateString('pt-BR');
    const header  = `### 📦 Release ${version} (${dateStr})`;

    let content = readBacklog();
    const lines = content.split('\n');
    const feitoIdx = lines.findIndex(l => l.startsWith('## Feito'));
    if (feitoIdx === -1) { console.error('Error: "## Feito" section not found.'); process.exit(1); }

    lines.splice(feitoIdx + 1, 0, '', header, '- *(Nenhuma tarefa adicionada a esta release ainda)*');
    writeBacklog(lines.join('\n'));
    console.log(`Created release: ${header}`);
}

function handleChangelog() {
    let content = readBacklog();
    let lines   = content.split('\n');

    // 1. Auto-create release block if missing (auto-incremented version)
    ensureReleaseBlock(lines);

    // 2. Pull manually ticked [x] tasks from pending sections into the release block
    pullDoneTasksFromPending(lines);

    // 3. Adopt any orphan [x] tasks sitting between ## Feito and the release heading
    adoptOrphanDoneTasks(lines);

    // 4. Find the release block boundaries
    let startIdx = -1, endIdx = -1, releaseTitleLine = '';
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('### 📦 Release')) { startIdx = i; releaseTitleLine = lines[i]; break; }
    }
    if (startIdx === -1) { console.error('Error: No release block found.'); process.exit(1); }

    for (let i = startIdx + 1; i < lines.length; i++) {
        if (lines[i].startsWith('### 📦 Release') || lines[i].startsWith('## ') || lines[i].startsWith('---')) {
            endIdx = i; break;
        }
    }
    if (endIdx === -1) endIdx = lines.length;

    const rawContent = lines.slice(startIdx + 1, endIdx).join('\n').trim();

    if (!rawContent || !rawContent.includes('- [x]')) {
        console.log('\x1b[33m⚠ No completed tasks to publish. Mark tasks as done first.\x1b[0m');
        writeBacklog(lines.join('\n'));
        return;
    }

    // 5. Parse version from the title line; fall back to auto-increment
    let versionPart = getNextVersion();
    const match = releaseTitleLine.match(/Release\s+([^\s\-(]+)/i);
    if (match) versionPart = match[1];
    const datePart = new Date().toLocaleDateString('pt-BR');

    // 6. Format and prepend to CHANGELOG.md
    const formattedContent      = rawContent.replace(/- \[x\]/g, '*');
    const newReleaseChangelog   = `## [${versionPart}] - ${datePart}\n${formattedContent}\n\n`;
    const changelogHeader       = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n`;
    const currentChangelog      = fs.existsSync(CHANGELOG_PATH) ? fs.readFileSync(CHANGELOG_PATH, 'utf8') : '';

    let updatedChangelog = '';
    if (currentChangelog.includes('# Changelog')) {
        const firstVersionIdx = currentChangelog.indexOf('\n## [');
        updatedChangelog = firstVersionIdx !== -1
            ? currentChangelog.slice(0, firstVersionIdx) + '\n' + newReleaseChangelog + currentChangelog.slice(firstVersionIdx)
            : currentChangelog.trim() + '\n\n' + newReleaseChangelog;
    } else {
        updatedChangelog = changelogHeader + newReleaseChangelog;
    }

    fs.writeFileSync(CHANGELOG_PATH, updatedChangelog, 'utf8');
    console.log(`\x1b[32m✔ CHANGELOG.md updated — ${versionPart} (${datePart})\x1b[0m`);

    // 7. Remove processed release block from backlog
    lines.splice(startIdx, endIdx - startIdx);

    const newFeitoIdx = lines.findIndex(l => l.startsWith('## Feito'));
    if (newFeitoIdx !== -1) {
        const next1 = (lines[newFeitoIdx + 1] || '').trim();
        const next2 = (lines[newFeitoIdx + 2] || '').trim();
        const isEmpty = (!next1 || next1.startsWith('##') || next1.startsWith('---')) &&
                        (!next2 || next2.startsWith('##') || next2.startsWith('---'));
        if (isEmpty) lines.splice(newFeitoIdx + 1, 0, '', '*(Nenhum item concluído neste ciclo ainda)*');
    }

    writeBacklog(lines.join('\n'));
    console.log('\x1b[32m✔ backlog.md cleaned — ready for the next cycle!\x1b[0m');
}
