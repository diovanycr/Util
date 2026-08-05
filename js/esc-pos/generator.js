// ============================================================
//  esc-pos/generator.js — Geração dos comandos ESC/POS em vários formatos
// ============================================================

import { PRINTERS } from './constants.js';

function _strToHex(str) {
    return [...str].map(c => c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

export function buildCommands(state, text) {
    const cmds = [];

    const alignByte = state.align === 'left' ? '00' : state.align === 'right' ? '02' : '01';
    cmds.push({ name: 'Alinhamento', hex: `1B 61 ${alignByte}` });

    const fontByte = state.font === 'b' ? '01' : '00';
    cmds.push({ name: 'Fonte', hex: `1B 4D ${fontByte}` });

    cmds.push({ name: 'Negrito', hex: `1B 45 ${state.bold ? '01' : '00'}` });

    cmds.push({ name: 'Sublinhado', hex: `1B 2D ${state.underline ? '01' : '00'}` });

    text.split('\n').forEach((line, i) => {
        const lineHex = _strToHex(line);
        cmds.push({ name: `Texto linha ${i + 1}`, hex: lineHex });
        cmds.push({ name: `Quebra linha ${i + 1}`, hex: '0A' });
    });

    if (state.feed > 0) {
        cmds.push({ name: 'Avanco de papel', hex: `1B 64 ${state.feed.toString(16).padStart(2, '0').toUpperCase()}` });
    }

    if (state.cut) {
        cmds.push({ name: 'Cortar papel', hex: '1D 56 00' });
    }

    if (state.drawer) {
        cmds.push({ name: 'Abrir gaveta', hex: '1B 70 00 19 FA' });
    }

    return cmds;
}

export function renderHex(cmds, state) {
    const printerName = PRINTERS[state.printer].name;
    const lines = [
        `:: Comandos ESC/POS - ${printerName}`,
        `:: Baud: ${state.baud} | Alinhamento: ${state.align} | Fonte: ${state.font}`,
        `:: Negrito: ${state.bold ? 'Sim' : 'Não'} | Sublinhado: ${state.underline ? 'Sim' : 'Não'}`,
        `:: Corte: ${state.cut ? 'Sim' : 'Não'} | Gaveta: ${state.drawer ? 'Sim' : 'Não'} | Avanco: ${state.feed} linhas`,
        '',
    ];
    cmds.forEach(c => lines.push(`:: ${c.name}`, c.hex, ''));
    return lines.join('\n');
}

export function renderBat(cmds, state) {
    const printerName = PRINTERS[state.printer].name;
    const bat = [
        '@echo off',
        `:: Teste de impressora termica - ${printerName}`,
        `:: Envia comandos ESC/POS para a porta serial`,
        `:: Baud rate: ${state.baud}`,
        ':: Execute como Administrador',
        '',
        'net session >nul 2>&1',
        'if %errorLevel% neq 0 (',
        '    echo Erro: execute como Administrador.',
        '    pause & exit /b 1',
        ')',
        '',
        ':: Configura porta serial (ajuste COM1 se necessario)',
        `mode COM1 BAUD=${state.baud} PARITY=N DATA=8 STOP=1`,
        '',
        ':: Envia comandos ESC/POS',
    ];
    cmds.forEach(c => {
        bat.push(`:: ${c.name}`);
        const bytes = c.hex.split(' ');
        const hexStr = bytes.map(b => '0x' + b).join(',');
        bat.push(`echo|set /p="?${hexStr}">COM1`);
    });
    bat.push('', 'echo Comandos enviados!', 'pause');
    return bat.join('\n');
}

export function renderPs1(cmds, state) {
    const printerName = PRINTERS[state.printer].name;
    const ps = [
        `# Teste de impressora termica - ${printerName}`,
        `# Baud rate: ${state.baud}`,
        '# Execute como Administrador',
        '',
        '$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())',
        'if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {',
        '    Write-Error "Execute como Administrador!" ; exit 1',
        '}',
        '',
        '$port = New-Object System.IO.Ports.SerialPort "COM1", ' + state.baud + ', "None", 8, "One"',
        '$port.Open()',
        '',
        '# Envia comandos ESC/POS',
    ];
    cmds.forEach(c => {
        ps.push(`# ${c.name}`);
        const bytes = c.hex.split(' ');
        const byteArr = bytes.map(b => '0x' + b).join(',');
        ps.push(`$port.Write([byte[]](${byteArr}), 0, ${bytes.length})`);
    });
    ps.push('', '$port.Close()', 'Write-Host "Comandos enviados com sucesso!" -ForegroundColor Green');
    return ps.join('\n');
}

export function renderPython(cmds, state) {
    const printerName = PRINTERS[state.printer].name;
    const py = [
        '# Teste de impressora termica - ' + printerName,
        '# Requer: pip install pyserial',
        '# Baud rate: ' + state.baud,
        '',
        'import serial',
        '',
        `ser = serial.Serial('COM1', ${state.baud}, timeout=1)`,
        '',
        '# Envia comandos ESC/POS',
    ];
    cmds.forEach(c => {
        py.push(`# ${c.name}`);
        const bytes = c.hex.split(' ');
        const byteArr = bytes.map(b => '0x' + b).join(',');
        py.push(`ser.write(bytes([${byteArr}]))`);
    });
    py.push('', 'ser.close()', 'print("Comandos enviados com sucesso!")');
    return py.join('\n');
}

export function renderRaw(cmds, state) {
    const printerName = PRINTERS[state.printer].name;
    const raw = [
        `Comandos ESC/POS - ${printerName}`,
        `Baud: ${state.baud} | Alinhamento: ${state.align} | Fonte: ${state.font}`,
        `Negrito: ${state.bold ? 'Sim' : 'Nao'} | Sublinhado: ${state.underline ? 'Sim' : 'Nao'}`,
        `Corte: ${state.cut ? 'Sim' : 'Nao'} | Gaveta: ${state.drawer ? 'Sim' : 'Nao'} | Avanco: ${state.feed} linhas`,
        '',
    ];
    cmds.forEach(c => raw.push(`${c.name}: ${c.hex}`));
    return raw.join('\n');
}

export function buildSummary(state) {
    const printerName = PRINTERS[state.printer].name;
    const features = [];
    if (state.bold) features.push('Negrito');
    if (state.underline) features.push('Sublinhado');
    if (state.cut) features.push('Corte');
    if (state.drawer) features.push('Gaveta');
    features.push(`Avanco: ${state.feed}`);
    return `${printerName} · ${state.baud} baud · ${state.align} · ${features.join(', ')}`;
}
