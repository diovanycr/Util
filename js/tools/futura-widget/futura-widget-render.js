/**
 * futura-widget-render.js — Renderização de respostas, resultados e erros
 */
import { TARGET_DOMAIN } from './futura-widget-config.js';

export function showExplanation(ctx, query, text) {
  const { aiBlock, queryLabel, summaryContent } = ctx.dom;
  queryLabel.textContent = `"${query}"`;
  aiBlock.classList.remove("fw-hidden");
  summaryContent.innerHTML = formatResponse(ctx, text);
  aiBlock.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

export function formatResponse(ctx, text) {
  const { _escAttr } = ctx.utils;
  text = text.replace(/\*\*Páginas encontradas:\*\*[\s\S]*$/i, "").trim();

  if (typeof marked === "undefined" || typeof DOMPurify === "undefined") {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  text = text.replace(/\[\^?(\d+)\^?\]/g, (match, num) => {
    const idx = parseInt(num, 10) - 1;
    if (ctx.currentResults && ctx.currentResults[idx]) {
      const article = ctx.currentResults[idx];
      const safeLink = /^https?:\/\//i.test(article.link || "") ? article.link : "#";
      const safeTitle = _escAttr(article.title || "");
      return `<a href="${safeLink}" target="_blank" class="citation-badge" title="${safeTitle}">${num}</a>`;
    }
    return match;
  });

  let rawHtml = marked.parse(text);

  rawHtml = rawHtml.replace(/<pre><code(.*?)>([\s\S]*?)<\/code><\/pre>/g, (match, attrs, code) => {
    return `<pre><code${attrs}>${code}</code><button class="copy-code-btn"><i class="fa-solid fa-copy"></i> <span>Copiar</span></button></pre>`;
  });

  return DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['target'] });
}

export function copyCode(ctx, btn) {
  const codeEl = btn.previousElementSibling;
  if (!codeEl) return;
  const text = codeEl.textContent;
  navigator.clipboard.writeText(text).then(() => {
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check" style="color:var(--success)"></i> <span>Copiado!</span>';
    btn.style.borderColor = "var(--success)";
    btn.style.color = "var(--success)";

    ctx.utils.showToast("Código copiado.", "success");

    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.style.borderColor = "";
      btn.style.color = "";
    }, 2000);
  }).catch(() => {
    ctx.utils.showToast("Falha ao copiar.", "error");
  });
}

export function renderResults(ctx, results) {
  const { resultsContainer, widgetScope } = ctx.dom;
  const { _escHtml, _escAttr } = ctx.utils;
  ctx.currentResults = results;
  resultsContainer.innerHTML = "";
  results.forEach((r, i) => {
    const card = document.createElement("div");
    card.className = "result-card"; card.style.animationDelay = `${i * 0.06}s`;
    const safeTitle = _escHtml(r.title || "");
    const safeDesc = _escHtml(r.description || "");
    let bc = ""; try { bc = new URL(r.link).pathname.split("/").filter(Boolean).join(" › "); } catch {}
    const safeLink = /^https?:\/\//i.test(r.link || "") ? r.link : "#";
    card.innerHTML = `
      <div class="card-meta"><div class="card-source"><i class="fa-solid fa-book-open"></i> ${_escHtml(bc || TARGET_DOMAIN)}</div></div>
      <h3>${safeTitle}</h3>
      ${r.description ? `<p>${safeDesc}</p>` : ""}
      <a class="card-link" href="${_escAttr(safeLink)}" target="_blank" rel="noopener noreferrer">Abrir artigo <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`;
    resultsContainer.appendChild(card);
  });
}

export function renderNoResults(ctx, query) {
  const { resultsContainer } = ctx.dom;
  const { _escHtml } = ctx.utils;
  resultsContainer.innerHTML = `<div class="no-results"><i class="fa-solid fa-magnifying-glass"></i><p>Nenhum resultado encontrado para <strong>"${_escHtml(query)}"</strong>.</p></div>`;
}

export function renderError(ctx, query, msg) {
  const { resultsContainer } = ctx.dom;
  const { _escHtml } = ctx.utils;
  resultsContainer.innerHTML = `<div class="no-results"><i class="fa-solid fa-circle-exclamation" style="color:var(--danger)"></i><p>Erro ao pesquisar <strong>"${_escHtml(query)}"</strong>.<br><small style="color:var(--muted)">${_escHtml(msg)}</small></p></div>`;
}
