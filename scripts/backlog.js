/**
 * CLI Manager for backlog.md
 * Zero-dependency helper to add, complete, and bundle release tasks.
 * 
 * Usage:
 *   node scripts/backlog.js add "Task description" --size M --scope UI
 *   node scripts/backlog.js done "#12"
 *   node scripts/backlog.js done "Task description substring"
 *   node scripts/backlog.js release "v1.2.0"
 *   node scripts/backlog.js changelog
 */

const fs = require('fs');
const path = require('path');

const BACKLOG_PATH = path.join(__dirname, '../backlog.md');
const CHANGELOG_PATH = path.join(__dirname, '../CHANGELOG.md');

// Helper to print usage
function printUsage() {
    console.log(`
\x1b[1m\x1b[34m📋 PainelAtende - Backlog CLI Manager\x1b[0m
Usage:
  node scripts/backlog.js add "<description>" [--size P|M|G] [--scope <name>]
  node scripts/backlog.js done "<id_or_title>"
  node scripts/backlog.js release "<version_tag>"
  node scripts/backlog.js changelog
`);
}

// Read and parse backlog file
function readBacklog() {
    if (!fs.existsSync(BACKLOG_PATH)) {
        console.error(`Error: backlog.md not found at ${BACKLOG_PATH}`);
        process.exit(1);
    }
    return fs.readFileSync(BACKLOG_PATH, 'utf8');
}

// Write back to backlog file
function writeBacklog(content) {
    fs.writeFileSync(BACKLOG_PATH, content, 'utf8');
    console.log('\x1b[32m✔ backlog.md updated successfully!\x1b[0m');
}

// Main logic router
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
    printUsage();
    process.exit(0);
}

switch (command.toLowerCase()) {
    case 'add':
        handleAdd(args.slice(1));
        break;
    case 'done':
        handleDone(args.slice(1));
        break;
    case 'release':
        handleRelease(args.slice(1));
        break;
    case 'changelog':
        handleChangelog();
        break;
    default:
        console.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
}

// ----------------------------------------------------
// COMMAND HANDLERS
// ----------------------------------------------------

function handleAdd(cmdArgs) {
    const title = cmdArgs[0];
    if (!title) {
        console.error('Error: Please specify the task description/title.');
        process.exit(1);
    }

    // Parse options
    let size = 'M';
    let scope = 'Geral';
    
    for (let i = 1; i < cmdArgs.length; i++) {
        if (cmdArgs[i] === '--size' && cmdArgs[i + 1]) {
            size = cmdArgs[i + 1].toUpperCase();
        }
        if (cmdArgs[i] === '--scope' && cmdArgs[i + 1]) {
            scope = cmdArgs[i + 1];
        }
    }

    const taskLine = `- [ ] **${title}** \`[${size}]\` \`[${scope}]\``;

    let content = readBacklog();
    const nextHeaderIdx = content.indexOf('## Próximo');
    if (nextHeaderIdx === -1) {
        console.error('Error: "## Próximo" section not found in backlog.md');
        process.exit(1);
    }

    // Find insertion point right after ## Próximo section text
    const nextLineIdx = content.indexOf('\n', nextHeaderIdx);
    let insertPos = nextLineIdx + 1;
    
    // Skip empty lines or placeholder text
    const remainder = content.slice(insertPos);
    const firstNonEmptyMatch = remainder.match(/\S/);
    if (firstNonEmptyMatch && remainder.slice(0, firstNonEmptyMatch.index).includes('Aguardando novas priorizações')) {
        // Replace placeholder with new item
        const placeholderStart = insertPos + remainder.indexOf('*(Aguardando');
        const placeholderEnd = content.indexOf('\n', placeholderStart);
        content = content.slice(0, placeholderStart) + taskLine + content.slice(placeholderEnd);
    } else {
        // Insert new task line
        content = content.slice(0, insertPos) + taskLine + '\n' + content.slice(insertPos);
    }

    writeBacklog(content);
    console.log(`Added task: ${taskLine}`);
}

function handleDone(cmdArgs) {
    const target = cmdArgs[0];
    if (!target) {
        console.error('Error: Please specify task ID or Title snippet to complete.');
        process.exit(1);
    }

    let content = readBacklog();
    const lines = content.split('\n');
    let taskIdx = -1;
    let taskLine = '';

    // Find the task in pending sections (Em andamento / Próximo)
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('- [ ]') && line.toLowerCase().includes(target.toLowerCase())) {
            taskIdx = i;
            taskLine = line;
            break;
        }
    }

    if (taskIdx === -1) {
        console.error(`Error: Could not find any pending task matching "${target}"`);
        process.exit(1);
    }

    // Remove the task from its current position
    lines.splice(taskIdx, 1);

    // If section becomes empty, insert placeholder
    // Check if previous line was a header and next line is a header or divider
    const prevLine = lines[taskIdx - 1] || '';
    const nextLine = lines[taskIdx] || '';
    if (prevLine.startsWith('##') && (nextLine.startsWith('##') || nextLine.startsWith('---') || nextLine.trim() === '')) {
        lines.splice(taskIdx, 0, '*(Nenhum item pendente)*');
    }

    // Prepare checked-off line
    const doneLine = taskLine.replace('- [ ]', '- [x]');

    // Find the first Release heading under ## Feito to insert the done task
    let releaseHeaderIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('### 📦 Release')) {
            releaseHeaderIdx = i;
            break;
        }
    }

    if (releaseHeaderIdx !== -1) {
        // Insert under the latest release heading
        lines.splice(releaseHeaderIdx + 1, 0, doneLine);
    } else {
        // No release heading found, find ## Feito and insert right after it
        let feitoHeaderIdx = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('## Feito')) {
                feitoHeaderIdx = i;
                break;
            }
        }
        if (feitoHeaderIdx === -1) {
            console.error('Error: "## Feito" section not found in backlog.md');
            process.exit(1);
        }
        lines.splice(feitoHeaderIdx + 1, 0, doneLine);
    }

    writeBacklog(lines.join('\n'));
    console.log(`Marked as completed: ${doneLine}`);
}

function handleRelease(cmdArgs) {
    const version = cmdArgs[0];
    if (!version) {
        console.error('Error: Please specify the version tag (e.g. v1.2.0).');
        process.exit(1);
    }

    const dateStr = new Date().toLocaleDateString('pt-BR');
    const newReleaseHeader = `### 📦 Release ${version} (Criada em ${dateStr})`;

    let content = readBacklog();
    const lines = content.split('\n');

    // Find ## Feito section
    let feitoHeaderIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('## Feito')) {
            feitoHeaderIdx = i;
            break;
        }
    }

    if (feitoHeaderIdx === -1) {
        console.error('Error: "## Feito" section not found in backlog.md');
        process.exit(1);
    }

    // Insert new release header under ## Feito
    lines.splice(feitoHeaderIdx + 1, 0, '', newReleaseHeader, '- *(Nenhuma tarefa adicionada a esta release ainda)*');
    writeBacklog(lines.join('\n'));
    console.log(`Created release section: ${newReleaseHeader}`);
}

function handleChangelog() {
    let content = readBacklog();
    const lines = content.split('\n');

    // Find the latest release section under ## Feito
    let startIdx = -1;
    let endIdx = -1;
    let releaseTitleLine = '';

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('### 📦 Release')) {
            startIdx = i;
            releaseTitleLine = lines[i];
            break;
        }
    }

    if (startIdx === -1) {
        console.error('Error: No release block (starting with "### 📦 Release") found under ## Feito to process.');
        process.exit(1);
    }

    // Find the end of this release block (either next release heading, or next section heading, or EOF)
    for (let i = startIdx + 1; i < lines.length; i++) {
        if (lines[i].startsWith('### 📦 Release') || lines[i].startsWith('## ') || lines[i].startsWith('---')) {
            endIdx = i;
            break;
        }
    }
    if (endIdx === -1) endIdx = lines.length;

    // Get the raw tasks inside the release block
    const rawReleaseContent = lines.slice(startIdx + 1, endIdx).join('\n').trim();

    // Check if there are any completed tasks in this block
    if (!rawReleaseContent || rawReleaseContent.includes('*(Nenhuma tarefa')) {
        console.log('No completed tasks found in the latest release to generate CHANGELOG.');
        return;
    }

    // Parse version and date from title line (e.g. "### 📦 Release v1.1.0 - Estilização Premium, Correções e UX (15/07/2026)")
    // Format version for changelog header: "## [v1.1.0] - 15/07/2026"
    let versionPart = 'Release';
    let datePart = new Date().toLocaleDateString('pt-BR');
    
    const versionMatch = releaseTitleLine.match(/Release\s+([^\s\-]+)/i);
    if (versionMatch) {
        versionPart = versionMatch[1];
    }
    const dateMatch = releaseTitleLine.match(/\(([^)]+)\)/);
    if (dateMatch) {
        datePart = dateMatch[1];
    }

    // Convert task checkboxes to bullet points: "- [x]" to "*"
    const formattedContent = rawReleaseContent.replace(/- \[x\]/g, '*');

    const newReleaseChangelog = `## [${versionPart}] - ${datePart}\n${formattedContent}\n\n`;

    // 1. Read / Prep CHANGELOG.md (create if not exists)
    let changelogHeader = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n`;
    let currentChangelog = '';
    
    if (fs.existsSync(CHANGELOG_PATH)) {
        currentChangelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');
    }

    let updatedChangelog = '';
    if (currentChangelog.includes('# Changelog')) {
        // Find where to insert (right after the main header or first version entry)
        const firstVersionIdx = currentChangelog.indexOf('\n## [');
        if (firstVersionIdx !== -1) {
            updatedChangelog = currentChangelog.slice(0, firstVersionIdx) + '\n' + newReleaseChangelog + currentChangelog.slice(firstVersionIdx);
        } else {
            // Append at the end of the existing content (if no versions exist yet)
            updatedChangelog = currentChangelog.trim() + '\n\n' + newReleaseChangelog;
        }
    } else {
        // Create new CHANGELOG
        updatedChangelog = changelogHeader + newReleaseChangelog;
    }

    fs.writeFileSync(CHANGELOG_PATH, updatedChangelog, 'utf8');
    console.log(`\x1b[32m✔ CHANGELOG.md updated successfully at ${CHANGELOG_PATH}!\x1b[0m`);

    // 2. Remove the processed release block from backlog.md
    lines.splice(startIdx, endIdx - startIdx);
    
    // Check if the ## Feito section is empty (no releases left) and add a placeholder if so
    let feitoHeaderIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('## Feito')) {
            feitoHeaderIdx = i;
            break;
        }
    }

    if (feitoHeaderIdx !== -1) {
        // Check if next lines are empty or lead to another section
        const nextLine1 = lines[feitoHeaderIdx + 1] || '';
        const nextLine2 = lines[feitoHeaderIdx + 2] || '';
        const isFeitoEmpty = (!nextLine1.trim() || nextLine1.startsWith('## ') || nextLine1.startsWith('---')) &&
                             (!nextLine2.trim() || nextLine2.startsWith('## ') || nextLine2.startsWith('---'));
        if (isFeitoEmpty) {
            lines.splice(feitoHeaderIdx + 1, 0, '', '*(Nenhum item concluído neste ciclo ainda)*');
        }
    }

    writeBacklog(lines.join('\n'));
    console.log('\x1b[32m✔ Cleared processed release from backlog.md!\x1b[0m');
}
