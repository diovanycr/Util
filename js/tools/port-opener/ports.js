// ============================================================
//  port-opener/ports.js — Manipulação de portas (tags/quick/validação)
// ============================================================

import { COMMON_PORTS, QUICK_PORTS } from './constants.js';
import { escapeHtml, escapeAttr } from '../../core/utils.js';

function _shakeField() {
  const f = document.getElementById('poTagField');
  if (!f) return;
  f.classList.remove('po-shake'); void f.offsetWidth; f.classList.add('po-shake');
  setTimeout(() => f.classList.remove('po-shake'), 400);
}

export function tryAddPort(ports, raw, callbacks) {
  if (!raw) return;
  const n = parseInt(raw);
  const input = /** @type {HTMLInputElement|null} */ (document.getElementById('poPortInput'));
  if (isNaN(n) || n < 1 || n > 65535) { _shakeField(); if (input) input.value=''; return; }
  if (ports.find(p=>p.num===n)) { if (input) input.value=''; return; }
  ports.push({num:n, label: COMMON_PORTS[n]||''});
  if (input) input.value = '';
  callbacks.onChange();
}

export function removePort(ports, num, callbacks) {
  const idx = ports.findIndex(p=>p.num===num);
  if (idx >= 0) {
    ports.splice(idx, 1);
    callbacks.onChange();
  }
}

export function renderTags(ports, getRemoveHandler) {
  const pills = document.getElementById('poTagPills');
  if (!pills) return;
  pills.innerHTML = ports.map(p => `
    <span class="po-tag-pill">
      ${p.num}${p.label ? ` <span class="po-tag-name">${escapeHtml(p.label)}</span>` : ''}
      <button class="po-tag-remove" data-num="${p.num}" aria-label="Remover porta ${p.num}${p.label ? ` (${escapeAttr(p.label)})` : ''}">×</button>
    </span>
  `).join('');
  pills.querySelectorAll('.po-tag-remove').forEach(btn =>
    btn.addEventListener('click', () => getRemoveHandler(parseInt(/** @type {HTMLElement} */ (btn).dataset.num || '0')))
  );
}

export function renderQuickPorts(ports, getToggleHandler) {
  const grid = document.getElementById('poQuickGrid');
  if (!grid) return;
  grid.innerHTML = QUICK_PORTS.map(p => {
    const isActive = !!ports.find(x => x.num === p.port);
    return `
    <button class="po-quick-btn ${isActive ? 'active' : ''}" role="button" aria-pressed="${isActive}" data-port="${p.port}" data-label="${escapeAttr(p.label)}">
      <span class="po-q-num">${p.port}</span>
      <span class="po-q-label">${escapeHtml(p.label)}</span>
    </button>`;
  }).join('');

  grid.querySelectorAll('.po-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => getToggleHandler(parseInt(/** @type {HTMLElement} */ (btn).dataset.port || '0'), /** @type {HTMLElement} */ (btn).dataset.label));
  });
}

export function syncQuick(ports) {
  document.querySelectorAll('.po-quick-btn').forEach(btn => {
    const isActive = !!ports.find(p => p.num === parseInt(/** @type {HTMLElement} */ (btn).dataset.port || '0'));
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

export { _shakeField as shakeField };
