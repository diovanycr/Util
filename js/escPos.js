// ============================================================
//  escPos.js — Gerador de Comandos ESC/POS (Impressoras Térmicas)
// ============================================================
//  Entry point: mantém o estado, renderiza o painel via esc-pos/builders.js
//  e gera os comandos via esc-pos/generator.js.

import { setupSegmented, createHighlighter, setCode as setHighlightedCode } from './utils.js';
import { PRINTERS, DEFAULT_STATE } from './esc-pos/constants.js';
import { buildPanel } from './esc-pos/builders.js';
import {
    buildCommands, renderHex, renderBat, renderPs1,
    renderPython, renderRaw, buildSummary
} from './esc-pos/generator.js';

// Estado mutável da sessão (uma cópia isolada para evitar resetes parciais)
const state = { ...DEFAULT_STATE };

// Highlighter de sintaxe específico do ESC/POS (comandos batch/ps1/python/serial)
const _hlEsc = createHighlighter([
    // Comentários (prefixo preservado)
    { regex: /(^|\n)(:: ?.*|# .*|@echo off)/g, transform: (m, p, c, stash, span) => `${p}${stash(span('cmt', c))}` },
    // Strings
    { regex: /"([^"]*)"/g, cls: 'str' },
    // Variáveis PowerShell
    { regex: /(\$[\w.[\]]+)/g, cls: 'var' },
    // Hex bytes (XX XX XX ...)
    { regex: /\b([0-9A-Fa-f]{2}(?: [0-9A-Fa-f]{2})+)\b/g, cls: 'num' },
    // Números
    { regex: /\b(\d+)\b/g, cls: 'num' },
    // Comandos
    { regex: /\b(echo|set|mode|net|pause|exit|import|serial|ser|write|close|print|Write-Host|Write-Error|New-Object|if|else|for|function)\b/g, cls: 'cmd' }
]);

function _setCode(id, text) {
    setHighlightedCode(id, text, _hlEsc);
}

export function buildEscPosPanel() {
    return buildPanel(state);
}

// ── Bind de eventos (chamado depois do render) ─────────────────────────────
export function bindEscPosEvents(container) {
    setupSegmented(container.querySelector('#escSegPrinter'), btn => {
        state.printer = btn.dataset.printer;
        container.querySelector('#escPrinterNotes').textContent = PRINTERS[state.printer].notes;
    });
    setupSegmented(container.querySelector('#escSegBaud'), btn => { state.baud = parseInt(btn.dataset.baud); });
    setupSegmented(container.querySelector('#escSegAlign'), btn => { state.align = btn.dataset.align; });
    setupSegmented(container.querySelector('#escSegFont'), btn => { state.font = btn.dataset.font; });

    container.querySelector('#escBold')?.addEventListener('change', e => state.bold = e.target.checked);
    container.querySelector('#escUnderline')?.addEventListener('change', e => state.underline = e.target.checked);
    container.querySelector('#escCut')?.addEventListener('change', e => state.cut = e.target.checked);
    container.querySelector('#escDrawer')?.addEventListener('change', e => state.drawer = e.target.checked);

    const feedRange = container.querySelector('#escFeed');
    if (feedRange) {
        feedRange.addEventListener('input', e => {
            state.feed = parseInt(e.target.value);
            container.querySelector('#escFeedVal').textContent = state.feed;
        });
    }

    container.querySelector('#escBtnGenerate')?.addEventListener('click', _generate);

    // Output tabs
    const _activateTab = (tab) => {
        container.querySelectorAll('[id^="esc-tab-"]').forEach(t => {
            const active = t === tab;
            t.classList.toggle('active', active);
            t.setAttribute('aria-selected', active ? 'true' : 'false');
            t.setAttribute('tabindex', active ? '0' : '-1');
        });
        container.querySelectorAll('[id^="escPane-"]').forEach(p => p.classList.add('hidden'));
        const pane = document.getElementById(`escPane-${tab.dataset.pane}`);
        if (pane) pane.classList.remove('hidden');
        tab.focus();
    };

    container.addEventListener('keydown', e => {
        if (!e.target.closest('[id^="esc-tab-"]')) return;
        const list = [...container.querySelectorAll('[id^="esc-tab-"]')];
        const idx = list.indexOf(e.target);
        let next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = list[(idx + 1) % list.length];
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = list[(idx - 1 + list.length) % list.length];
        else if (e.key === 'Home') next = list[0];
        else if (e.key === 'End') next = list[list.length - 1];
        if (next) { e.preventDefault(); _activateTab(next); }
    });

    container.addEventListener('click', e => {
        const tab = e.target.closest('[id^="esc-tab-"]');
        if (tab && tab.classList.contains('po-otab')) _activateTab(tab);
    });
}

// ── Geração dos comandos ───────────────────────────────────────────────────
function _generate() {
    const text = (document.getElementById('escText')?.value || '').trim() || 'PainelAtende - Teste de impressao';
    const cmds = buildCommands(state, text);

    _setCode('escRaw-hex',    renderHex(cmds, state));
    _setCode('escRaw-bat',    renderBat(cmds, state));
    _setCode('escRaw-ps1',    renderPs1(cmds, state));
    _setCode('escRaw-python', renderPython(cmds, state));
    _setCode('escRaw-raw',    renderRaw(cmds, state));

    document.getElementById('escSummaryText').textContent = buildSummary(state);

    // Reset output tabs
    const container = document.getElementById('poTool-escpos');
    if (!container) return;
    container.querySelectorAll('[id^="esc-tab-"]').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
    });
    container.querySelectorAll('[id^="escPane-"]').forEach(p => p.classList.add('hidden'));
    const firstTab = document.getElementById('esc-tab-hex');
    if (firstTab) {
        firstTab.classList.add('active');
        firstTab.setAttribute('aria-selected', 'true');
        firstTab.setAttribute('tabindex', '0');
    }
    document.getElementById('escPane-hex')?.classList.remove('hidden');

    const out = document.getElementById('escOutput');
    out.classList.remove('hidden');
    setTimeout(() => out.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}
