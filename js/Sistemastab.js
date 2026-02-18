// ============================================================
//  sistemasTab.js — Integra a aba Sistemas ao PainelAtende
// ============================================================

import { renderSistemasTab } from './portOpener.js';

export function initSistemas() {
  const container = document.getElementById('tabSistemas');
  if (!container) return;
  renderSistemasTab(container);
}
