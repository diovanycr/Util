// ============================================================
//  sistemasTab.js — Integra a aba Sistemas ao PainelAtende
//
//  COMO USAR:
//  No seu js/app.js, adicione no topo:
//
//    import { initSistemasTab } from './sistemasTab.js';
//
//  E no trecho onde as abas são inicializadas (geralmente após
//  o login, onde você mostra #userArea), adicione:
//
//    initSistemasTab();
//
//  Além disso, no seu handler de clique de abas (onde você
//  troca data-tab), adicione o case para 'tabSistemas' ou
//  deixe o código genérico já tratar — veja as instruções
//  no final deste arquivo.
// ============================================================

import { renderSistemasTab } from './portOpener.js';

let _initialized = false;

/**
 * Inicializa a aba Sistemas.
 * Chame esta função uma vez após o login do usuário.
 */
export function initSistemasTab() {
  if (_initialized) return;
  _initialized = true;

  const container = document.getElementById('tabSistemas');
  if (!container) {
    console.warn('[Sistemas] Container #tabSistemas não encontrado.');
    return;
  }

  renderSistemasTab(container);
  _bindTabShortcut();
}

/**
 * Adiciona o atalho de teclado "4" para ir para a aba Sistemas,
 * seguindo o padrão dos atalhos 1, 2, 3 já existentes no app.
 */
function _bindTabShortcut() {
  document.addEventListener('keydown', e => {
    // Ignora se estiver digitando em algum campo
    const tag = document.activeElement?.tagName;
    if (['INPUT','TEXTAREA'].includes(tag) || document.activeElement?.isContentEditable) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === '4') {
      e.preventDefault();
      // Dispara o clique na aba Sistemas para usar o mesmo handler do app
      document.querySelector('.tab[data-tab="tabSistemas"]')?.click();
    }
  });
}
