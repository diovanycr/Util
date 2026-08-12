const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_DIR = path.join(__dirname, '..');

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

function fileContains(filePath, pattern) {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes(pattern);
}

console.log('Running module tests...\n');

// Test: auth.js exports
console.log('Test: auth.js exports');
{
    const authPath = path.join(BASE_DIR, 'js', 'auth.js');
    assert(fileContains(authPath, 'export function initAuth'), 'Should export initAuth');
    assert(fileContains(authPath, 'export function updateHeaderProfileGreeting'), 'Should export updateHeaderProfileGreeting');
    assert(fileContains(authPath, 'export function clearHeaderGreetingInterval'), 'Should export clearHeaderGreetingInterval');
}

// Test: messages.js exports
console.log('Test: messages.js exports');
{
    const messagesPath = path.join(BASE_DIR, 'js', 'messages.js');
    assert(fileContains(messagesPath, 'export function initMessages'), 'Should export initMessages');
    assert(fileContains(messagesPath, 'export function resetMessages'), 'Should export resetMessages');
}

// Test: problems.js exports
console.log('Test: problems.js exports');
{
    const problemsPath = path.join(BASE_DIR, 'js', 'problems.js');
    assert(fileContains(problemsPath, 'export function initProblems'), 'Should export initProblems');
    assert(fileContains(problemsPath, 'export function resetProblems'), 'Should export resetProblems');
}

// Test: links.js exports
console.log('Test: links.js exports');
{
    const linksPath = path.join(BASE_DIR, 'js', 'links.js');
    assert(fileContains(linksPath, 'export function initLinks'), 'Should export initLinks');
    assert(fileContains(linksPath, 'export function resetLinks'), 'Should export resetLinks');
}

// Test: search.js exports
console.log('Test: search.js exports');
{
    const searchPath = path.join(BASE_DIR, 'js', 'search.js');
    assert(fileContains(searchPath, 'export function initSearch'), 'Should export initSearch');
    assert(fileContains(searchPath, 'export function resetSearch'), 'Should export resetSearch');
}

// Test: modal.js exports
console.log('Test: modal.js exports');
{
    const modalPath = path.join(BASE_DIR, 'js', 'modal.js');
    assert(fileContains(modalPath, 'export function showModal'), 'Should export showModal');
    assert(fileContains(modalPath, 'export function openConfirmModal'), 'Should export openConfirmModal');
}

// Test: toast.js exports
console.log('Test: toast.js exports');
{
    const toastPath = path.join(BASE_DIR, 'js', 'toast.js');
    assert(fileContains(toastPath, 'export function showToast'), 'Should export showToast');
}

// Test: utils.js exports
console.log('Test: utils.js exports');
{
    const utilsPath = path.join(BASE_DIR, 'js', 'utils.js');
    assert(fileContains(utilsPath, 'export function escapeHtml'), 'Should export escapeHtml');
    assert(fileContains(utilsPath, 'export function sanitizeHtml'), 'Should export sanitizeHtml');
    assert(fileContains(utilsPath, 'export function debounce'), 'Should export debounce');
    assert(fileContains(utilsPath, 'export function setupSegmented'), 'Should export setupSegmented');
    assert(fileContains(utilsPath, 'export function addKeyboardDragSupport'), 'Should export addKeyboardDragSupport');
    assert(fileContains(utilsPath, 'export function createHighlighter'), 'Should export createHighlighter');
}

// Test: theme.js exports
console.log('Test: theme.js exports');
{
    const themePath = path.join(BASE_DIR, 'js', 'theme.js');
    assert(fileContains(themePath, 'export function initTheme'), 'Should export initTheme');
}

// Test: enhancements.js exports
console.log('Test: enhancements.js exports');
{
    const enhancementsPath = path.join(BASE_DIR, 'js', 'enhancements.js');
    assert(fileContains(enhancementsPath, 'export function initEnhancements'), 'Should export initEnhancements');
    assert(fileContains(enhancementsPath, 'export function resetEnhancements'), 'Should export resetEnhancements');
}

// Test: portOpener.js exports
console.log('Test: portOpener.js exports');
{
    const portOpenerPath = path.join(BASE_DIR, 'js', 'portOpener.js');
    assert(fileContains(portOpenerPath, 'export function renderSistemasTab'), 'Should export renderSistemasTab');
    assert(fileContains(portOpenerPath, 'export function cleanupPortOpener'), 'Should export cleanupPortOpener');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);