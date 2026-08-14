// ============================================================
//  port-opener/generator.js — Geração dos scripts BAT/PS1/netsh/undo
// ============================================================

import { COMMON_PORTS } from './constants.js';
import { escapeHtml } from '../../core/utils.js';

function _ruleName(port, proto, dir) {
  const base = (COMMON_PORTS[port]||`Porta_${port}`).replace(/[\s/]/g,'_');
  return `${base}_${port}_${proto}_${dir==='IN'?'IN':'OUT'}`;
}

export function renderBat(ports, proto, dir) {
  const protos = proto==='BOTH'?['TCP','UDP']:[proto];
  const dirs   = dir  ==='BOTH'?['IN','OUT'] :[dir];

  const bat = [
    `@echo off`,
    `:: Abre portas no Firewall do Windows`,
    `:: Portas: ${ports.map(p=>p.num).join(', ')}`,
    `:: Execute como Administrador`,``,
    `net session >nul 2>&1`,
    `if %errorLevel% neq 0 (`,
    `    echo Erro: execute como Administrador.`,
    `    pause & exit /b 1`,`)`,
    `echo Abrindo portas no Firewall...`,`echo.`,
  ];
  for (const p of ports) {
    bat.push(`echo [${p.num}] ${p.label||'porta '+p.num}`);
    for (const pr of protos) for (const dr of dirs) {
      bat.push(`netsh advfirewall firewall add rule name="${_ruleName(p.num,pr,dr)}" dir=${dr==='IN'?'in':'out'} action=allow protocol=${pr} localport=${p.num} enable=yes profile=any`);
    }
    bat.push('');
  }
  bat.push(`echo Concluido! ${ports.length} porta(s) configurada(s).`,`pause`);
  return bat.join('\n');
}

export function renderPs1(ports, proto, dir) {
  const protos = proto==='BOTH'?['TCP','UDP']:[proto];
  const dirs   = dir  ==='BOTH'?['IN','OUT'] :[dir];

  const ps = [
    `# Abre portas no Firewall do Windows`,
    `# Portas: ${ports.map(p=>p.num).join(', ')}`,
    `# Execute como Administrador`,``,
    `$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())`,
    `if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {`,
    `    Write-Error "Execute como Administrador!" ; exit 1`,`}`,``,
    `Write-Host "Abrindo portas..." -ForegroundColor Cyan`,``,
  ];
  for (const p of ports) {
    ps.push(`# ${p.num}${p.label?' — '+p.label:''}`);
    for (const pr of protos) for (const dr of dirs) {
      ps.push(`New-NetFirewallRule -DisplayName "${_ruleName(p.num,pr,dr)}" -Direction ${dr==='IN'?'Inbound':'Outbound'} -Action Allow -Protocol ${pr} -LocalPort ${p.num} -Enabled True -Profile Any`);
    }
    ps.push('');
  }
  ps.push(`Write-Host "Concluido! ${ports.length} porta(s) configurada(s)." -ForegroundColor Green`);
  return ps.join('\n');
}

export function renderNetsh(ports, proto, dir) {
  const protos = proto==='BOTH'?['TCP','UDP']:[proto];
  const dirs   = dir  ==='BOTH'?['IN','OUT'] :[dir];

  const netsh = [`:: Cole no CMD como Administrador`,``];
  for (const p of ports) {
    netsh.push(`:: ${p.num}${p.label?' — '+p.label:''}`);
    for (const pr of protos) for (const dr of dirs)
      netsh.push(`netsh advfirewall firewall add rule name="${_ruleName(p.num,pr,dr)}" dir=${dr==='IN'?'in':'out'} action=allow protocol=${pr} localport=${p.num} enable=yes profile=any`);
    netsh.push('');
  }
  return netsh.join('\n');
}

export function renderUndo(ports, proto, dir) {
  const protos = proto==='BOTH'?['TCP','UDP']:[proto];
  const dirs   = dir  ==='BOTH'?['IN','OUT'] :[dir];

  const undo = [
    `@echo off`,`:: Remove regras criadas`,
    `:: Portas: ${ports.map(p=>p.num).join(', ')}`,``,
    `net session >nul 2>&1`,
    `if %errorLevel% neq 0 ( echo Execute como Administrador. & pause & exit /b 1 )`,``,
  ];
  for (const p of ports) for (const pr of protos) for (const dr of dirs)
    undo.push(`netsh advfirewall firewall delete rule name="${_ruleName(p.num,pr,dr)}"`);
  undo.push(``,`echo Regras removidas com sucesso.`,`pause`);
  return undo.join('\n');
}

export function buildSummary(ports, proto, dir) {
  const dirLabel = dir==='IN'?'Entrada':dir==='OUT'?'Saída':'Entrada + Saída';
  return {
    text: `${ports.length} porta${ports.length>1?'s':''} · ${proto} · ${dirLabel}`,
    tagsHTML: ports.map(p=>`<span class="po-s-tag">${escapeHtml(p.num)}</span>`).join('')
  };
}
