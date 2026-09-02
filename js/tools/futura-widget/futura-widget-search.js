/**
 * futura-widget-search.js — Busca principal, modo sem API e com API
 */
import { TARGET_DOMAIN } from './futura-widget-config.js';
import { functions, httpsCallable } from '../../../core/firebase.js';

const aiProxyFn = httpsCallable(functions, 'aiProxy');

export function buildPrompt(query) {
  return `Pesquise APENAS no site ${TARGET_DOMAIN} e responda a seguinte dúvida sobre o ERP Futura Sistemas:\n\n"${query}"\n\nLeia os artigos encontrados e responda de forma clara e objetiva:\n\n**Resposta direta:** (responda a pergunta)\n\n**Como funciona no sistema:** (passo a passo)\n\n**Onde configurar:** (Menu > Módulo > Tela)\n\n**Dicas importantes:** (pontos de atenção e boas práticas)\n\nResponda em português brasileiro.`;
}

export function openChatGPT(q) {
  window.open("https://chatgpt.com/?q=" + encodeURIComponent(buildPrompt(q)), "_blank");
}

export function openPerplexity(q) {
  window.open("https://www.perplexity.ai/search?q=" + encodeURIComponent(buildPrompt(q)), "_blank");
}

export function showProviderChoice(ctx, query) {
  const { aiBlock, queryLabel, summaryContent, widgetScope } = ctx.dom;
  queryLabel.textContent = `"${query}"`;
  aiBlock.classList.remove("fw-hidden");
  const { _escHtml, _escAttr } = ctx.utils;
  summaryContent.innerHTML = `
    <p style="font-size:13.5px;color:var(--muted);margin-bottom:18px">
      Escolha onde pesquisar. A pergunta já vai formatada para buscar no manual da Futura:
    </p>
    <div class="provider-choice">
      <div class="provider-btn-card" data-action="open-chatgpt" data-query="${_escAttr(query)}">
        <div class="provider-btn-icon chatgpt-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073z"/></svg>
        </div>
        <div class="provider-btn-info">
          <strong>Abrir no ChatGPT</strong>
          <span>Gratuito — abre com a pergunta pronta</span>
        </div>
        <i class="fa-solid fa-arrow-up-right-from-square provider-btn-arrow"></i>
      </div>
      <div class="provider-btn-card" data-action="open-perplexity" data-query="${_escAttr(query)}">
        <div class="provider-btn-icon perplexity-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M22.3977 8.1417H17.676L12.6978 3.1236V8.1417H11.3023V3.1236L6.324 8.1417H1.6023v7.7144h3.3488v4.9975H8.63l3.0678-3.103 3.0701 3.103h3.6812v-4.9997h3.3488V8.1439zM7.1995 3.9l4.0905 4.2417H3.2545zm9.601 0 3.945 4.2417h-8.036zM2.9977 9.5394h8.3046v5.0189H2.9977zm5.6326 9.8232V15.254l2.4282 2.454zm2.9697-2.4984 2.4009-2.4286v4.927zm3.8034 2.4984-2.4282-1.6546 2.4282-2.454zm1.5977-4.8232H8.6977V9.5394h8.3034z"/></svg>
        </div>
        <div class="provider-btn-info">
          <strong>Abrir no Perplexity</strong>
          <span>Gratuito — especialista em pesquisa</span>
        </div>
        <i class="fa-solid fa-arrow-up-right-from-square provider-btn-arrow"></i>
      </div>
    </div>
    <div class="prompt-preview">
      <div class="prompt-preview-header"><i class="fa-solid fa-eye"></i> Pergunta que será enviada</div>
      <div class="prompt-preview-body">${_escHtml(buildPrompt(query)).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</div>
    </div>`;

  widgetScope.querySelectorAll("[data-action='open-chatgpt']").forEach(btn => {
    btn.addEventListener("click", () => openChatGPT(btn.dataset.query));
  });
  widgetScope.querySelectorAll("[data-action='open-perplexity']").forEach(btn => {
    btn.addEventListener("click", () => openPerplexity(btn.dataset.query));
  });
}

function buildAPIPrompt(query) {
  return `Você é especialista no ERP Futura Sistemas. Pesquise em ${TARGET_DOMAIN} sobre: "${query}"\n\nResponda em português com esta estrutura:\n\n**Resposta direta:**\n\n**Como funciona:**\n\n**Onde configurar:**\n\n**Dicas importantes:**`;
}

async function callAIProxy(ctx, query) {
  const res = await aiProxyFn({ provider: ctx.config.provider, query: buildAPIPrompt(query) });
  return res.data;
}

async function searchWithAPI(ctx, query) {
  const { loaderEl, resultsContainer } = ctx.dom;
  ctx.setLoader(true, "Pesquisando no manual...");
  loaderEl.scrollIntoView({ behavior: "smooth", block: "nearest" });

  try {
    const response = await callAIProxy(ctx, query);

    ctx.setLoader(false);
    if (!response.explanation && response.results.length === 0) { ctx.render.renderNoResults(ctx, query); return; }

    ctx.searchCache.set(query.toLowerCase().trim(), response);
    if (ctx.searchCache.size > 100) {
      const oldest = ctx.searchCache.keys().next().value;
      ctx.searchCache.delete(oldest);
    }
    ctx.currentResults = response.results;

    if (response.results.length > 0) ctx.render.renderResults(ctx, response.results);
    ctx.render.showExplanation(ctx, query, response.explanation);
  } catch (err) {
    ctx.setLoader(false);
    ctx.utils.showToast(err.message, "error");
    ctx.render.renderError(ctx, query, err.message);
  }
}

export async function performSearch(ctx, query) {
  if (!query) return;
  if (ctx._searchInFlight) return;
  ctx._searchInFlight = true;
  try {
    await _performSearchInternal(ctx, query);
  } finally {
    ctx._searchInFlight = false;
  }
}

async function _performSearchInternal(ctx, query) {
  ctx.audio.stopAudioReading(ctx);

  ctx.config.mode = localStorage.getItem(ctx.lsKey("futura-mode")) || "noapi";
  ctx.config.provider = localStorage.getItem(ctx.lsKey("futura-provider")) || "";

  ctx.config.saveHistory(ctx, query);
  ctx.dom.suggestionsBox.innerHTML = "";
  ctx.dom.resultsContainer.innerHTML = "";
  ctx.dom.aiBlock.classList.add("fw-hidden");

  if (ctx.config.mode === "noapi") {
    showProviderChoice(ctx, query);
    ctx.dom.aiBlock.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return;
  }

  if (!ctx.config.provider) {
    ctx.modal.showConfigModal(ctx);
    ctx.utils.showToast("Selecione o provedor de IA nas configuracoes.", "info");
    return;
  }

  try { await ctx.depsReady; }
  catch {
    ctx.utils.showToast("Falha ao carregar recursos de formatação.", "error");
    return;
  }

  const cacheKey = query.toLowerCase().trim();
  if (ctx.searchCache.has(cacheKey)) {
    const cached = ctx.searchCache.get(cacheKey);
    ctx.searchCache.delete(cacheKey);
    ctx.searchCache.set(cacheKey, cached);
    ctx.utils.showToast("Carregado instantaneamente do cache local.", "success");
    ctx.currentResults = cached.results;
    if (cached.results.length > 0) ctx.render.renderResults(ctx, cached.results);
    ctx.render.showExplanation(ctx, query, cached.explanation);
    return;
  }

  await searchWithAPI(ctx, query);
}
