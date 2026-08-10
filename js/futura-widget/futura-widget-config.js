/**
 * futura-widget-config.js — CONFIG, sugestões, histórico e status pill
 */

export const TARGET_DOMAIN = 'manual.futurasistemas.com.br';

export const SUGGESTIONS = [
  'limite de desconto', 'cadastro de clientes', 'tabela de preço',
  'pedido mobile', 'vendedor padrão', 'controle de estoque',
  'romaneio de entrega', 'comissão de vendedor', 'contas a pagar',
  'contas a receber', 'duplicatas', 'ordem de serviço',
  'emissão de nfe', 'backup do sistema', 'replicador de dados',
  'cadastro de produto', 'grade de produto', 'parametrização fiscal',
  'relatório de vendas', 'fluxo de caixa', 'fechamento de caixa',
  'permissão de acesso', 'cadastro de fornecedor', 'entrada de mercadoria',
  'remessa de mercadoria', 'atualização de estoque', 'devolução de venda',
  'sangria de caixa', 'reforço de caixa', 'pedido de compra',
];

export function createConfig(lsKey) {
  return {
    mode: localStorage.getItem(lsKey('futura-mode')) || 'noapi',
    provider: localStorage.getItem(lsKey('futura-provider')) || '',
    apiKey: localStorage.getItem(lsKey('futura-apikey')) || '',
  };
}

export function syncConfig(lsKey) {
  return {
    mode: localStorage.getItem(lsKey('futura-mode')) || 'noapi',
    provider: localStorage.getItem(lsKey('futura-provider')) || '',
    apiKey: localStorage.getItem(lsKey('futura-apikey')) || '',
  };
}

export function getHistory(lsKey) {
  return JSON.parse(localStorage.getItem(lsKey('futura-history')) || '[]');
}

export function saveHistory(ctx, query) {
  let h = getHistory(ctx.lsKey).filter(x => x !== query);
  h.push(query);
  if (h.length > 50) h = h.slice(-50);
  localStorage.setItem(ctx.lsKey('futura-history'), JSON.stringify(h));
  renderHistory(ctx);
}

export function renderHistory(ctx) {
  const h = getHistory(ctx.lsKey);
  const { historyList } = ctx.dom;
  historyList.innerHTML = '';
  if (h.length === 0) {
    historyList.innerHTML = `<span style="color:var(--muted);font-size:12px;padding:6px 10px;display:block">Nenhuma pesquisa ainda</span>`;
    return;
  }
  [...h].reverse().slice(0, 20).forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', `Pesquisar novamente: ${item}`);
    div.innerHTML = `<i class="fa-solid fa-clock" aria-hidden="true"></i><span style="overflow:hidden;text-overflow:ellipsis">${ctx.utils._escHtml(item)}</span>`;
    const triggerSearch = () => { ctx.dom.searchInput.value = item; ctx.search.performSearch(ctx, item); };
    div.onclick = triggerSearch;
    div.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerSearch();
      }
    };
    historyList.appendChild(div);
  });
}

export function updateStatus(ctx) {
  const dot = ctx.dom.statusPill?.querySelector('.status-dot');
  const modeLabels = {
    noapi: 'Modo: Sem API',
    api: ctx.config.provider === 'openai' ? 'ChatGPT API' : 'Gemini API',
  };
  const active = ctx.config.mode === 'noapi' || (ctx.config.mode === 'api' && ctx.config.apiKey);
  if (dot) dot.classList.toggle('active', active);
  if (ctx.dom.statusLabel) ctx.dom.statusLabel.textContent = active ? modeLabels[ctx.config.mode] : 'Não configurado';
}
