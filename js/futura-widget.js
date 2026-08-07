/**
 * futura-widget.js — Ponto de entrada do FuturaSearchWidget
 *
 * Orquestra os módulos em ./futura-widget/:
 *   - template:  HTML do widget
 *   - config:    CONFIG, sugestões, histórico, status pill
 *   - utils:     escape, toast
 *   - theme:     tema escuro/claro escopado
 *   - search:    performSearch, showProviderChoice, callGemini, callOpenAI
 *   - render:    formatResponse, renderResults, renderNoResults, renderError
 *   - modal:     modal de configuração
 *   - audio:     busca por voz (STT) e leitor de respostas (TTS)
 *
 * O CSS está em css/futura-widget.css (linkado no index.html).
 */

import { WIDGET_HTML } from './futura-widget/futura-widget-template.js';
import {
  SUGGESTIONS,
  createConfig,
  saveHistory,
  renderHistory,
  updateStatus,
} from './futura-widget/futura-widget-config.js';
import { _escHtml, _escAttr, showToast } from './futura-widget/futura-widget-utils.js';
import { initTheme, toggleTheme } from './futura-widget/futura-widget-theme.js';
import { showProviderChoice, performSearch } from './futura-widget/futura-widget-search.js';
import {
  showExplanation,
  formatResponse,
  copyCode,
  renderResults,
  renderNoResults,
  renderError,
} from './futura-widget/futura-widget-render.js';
import { showConfigModal } from './futura-widget/futura-widget-modal.js';
import { initVoiceSearch, initAudioReader, stopAudioReading, destroyAudio } from './futura-widget/futura-widget-audio.js';

class FuturaSearchWidget {
  constructor(options) {
    this.containerId = options.containerId;
    this.userId = options.userId || '';
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error("FuturaSearchWidget: Container " + this.containerId + " not found.");
      return;
    }

    this.loadDependencies();
    this.init();
  }

  /* ------------------------------------------------------------------ */
  /* Chave de localStorage prefixada por userId                         */
  /* ------------------------------------------------------------------ */
  lsKey(key) {
    return this.userId ? key + '_' + this.userId : key;
  }

  /* ------------------------------------------------------------------ */
  /* Dependências externas (CDN)                                        */
  /* ------------------------------------------------------------------ */
  loadDependencies() {
    const cssDeps = [
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
      "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;400;500&display=swap"
    ];
    const jsDeps = [
      "https://cdn.jsdelivr.net/npm/marked/marked.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.8/purify.min.js"
    ];

    cssDeps.forEach(dep => {
      try {
        const fontAwesomeExists = dep.includes("font-awesome") && document.querySelector('link[href*="font-awesome"]');
        if (!fontAwesomeExists && !document.querySelector(`link[href="${dep}"]`)) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = dep;
          document.head.appendChild(link);
        }
      } catch (e) {
        console.error("FuturaSearchWidget: Error loading CSS dependency", e);
      }
    });

    const pendingScripts = [];
    jsDeps.forEach(dep => {
      try {
        const existing = document.querySelector(`script[src="${dep}"]`);
        if (!existing) {
          const promise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = dep;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load " + dep));
            document.head.appendChild(script);
          });
          pendingScripts.push(promise);
        }
      } catch (e) {
        console.error("FuturaSearchWidget: Error loading JS dependency", e);
      }
    });

    this._depsReady = Promise.all(pendingScripts);
  }

  /* ------------------------------------------------------------------ */
  /* Inicialização                                                       */
  /* ------------------------------------------------------------------ */
  init() {
    this.injectHTML();
    this.initLogic();
  }

  injectHTML() {
    this.container.classList.add('futura-search-widget');
    this.container.innerHTML = WIDGET_HTML;
  }

  initLogic() {
    const widgetScope = this.container;
    const depsReady = this._depsReady || Promise.reject(new Error("Dependencies not loaded"));

    /* ---------------------------------------------------------------- */
    /* Contexto compartilhado (ctx) — injetado em todos os módulos      */
    /* ---------------------------------------------------------------- */
    const config = createConfig(this.lsKey.bind(this));
    const searchCache = new Map();
    let currentResults = [];

    const dom = {
      searchInput: widgetScope.querySelector("#fw-searchInput"),
      searchBtn: widgetScope.querySelector("#fw-searchBtn"),
      resultsContainer: widgetScope.querySelector("#fw-results"),
      loaderEl: widgetScope.querySelector("#fw-loader"),
      loaderText: widgetScope.querySelector("#fw-loaderText"),
      skeletonLoader: widgetScope.querySelector("#fw-skeletonLoader"),
      voiceSearchBtn: widgetScope.querySelector("#fw-voiceSearchBtn"),
      audioReadBtn: widgetScope.querySelector("#fw-audioReadBtn"),
      historyList: widgetScope.querySelector("#fw-historyList"),
      clearHistoryBtn: widgetScope.querySelector("#fw-clearFuturaHistory"),
      suggestionsBox: widgetScope.querySelector("#fw-suggestions"),
      aiBlock: widgetScope.querySelector("#fw-aiBlock"),
      summaryContent: widgetScope.querySelector("#fw-summaryContent"),
      queryLabel: widgetScope.querySelector("#fw-queryLabel"),
      statusPill: widgetScope.querySelector("#fw-statusPill"),
      statusLabel: widgetScope.querySelector("#fw-statusLabel"),
      widgetScope,
    };

    const utils = { _escHtml, _escAttr, showToast };

    const setLoader = (visible, msg = "Aguarde...") => {
      dom.loaderEl?.classList.toggle("fw-hidden", !visible);
      dom.skeletonLoader?.classList.toggle("fw-hidden", !visible);
      if (dom.loaderText) dom.loaderText.textContent = msg;
    };

    const ctx = {
      widgetScope,
      lsKey: this.lsKey.bind(this),
      depsReady,
      config,
      dom,
      utils,
      setLoader,
      searchCache,
      currentResults,
      render: {
        showExplanation,
        formatResponse,
        copyCode,
        renderResults,
        renderNoResults,
        renderError,
      },
      search: {
        performSearch,
        showProviderChoice,
      },
      modal: {
        showConfigModal,
      },
      audio: {
        stopAudioReading,
      },
      theme: {
        initTheme,
        toggleTheme,
      },
    };

    ctx.config.saveHistory = saveHistory;
    ctx.config.updateStatus = updateStatus;

    /* ---------------------------------------------------------------- */
    /* Eventos globais do widget                                         */
    /* ---------------------------------------------------------------- */
    dom.clearHistoryBtn?.addEventListener("click", () => {
      localStorage.removeItem(this.lsKey("futura-history"));
      renderHistory(ctx);
      showToast("Histórico limpo.", "info");
    });

    /* AUTOCOMPLETE */
    dom.searchInput.addEventListener("input", () => {
      const val = dom.searchInput.value.toLowerCase().trim();
      dom.suggestionsBox.innerHTML = "";
      if (!val || val.length < 2) return;
      SUGGESTIONS.filter(s => s.toLowerCase().includes(val)).slice(0, 6).forEach(item => {
        const div = document.createElement("div");
        div.className = "suggestion-item";
        const idx = item.toLowerCase().indexOf(val);
        div.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i>`
          + item.slice(0, idx)
          + `<strong>${item.slice(idx, idx + val.length)}</strong>`
          + item.slice(idx + val.length);
        div.onclick = () => { dom.searchInput.value = item; dom.suggestionsBox.innerHTML = ""; search.performSearch(ctx, item); };
        dom.suggestionsBox.appendChild(div);
      });
    });

    widgetScope.addEventListener("click", e => { if (!e.target.closest(".search-wrap")) dom.suggestionsBox.innerHTML = ""; });
    dom.searchInput.addEventListener("keydown", e => {
      if (e.key === "Enter") { dom.suggestionsBox.innerHTML = ""; search.performSearch(ctx, dom.searchInput.value.trim()); }
      if (e.key === "Escape") dom.suggestionsBox.innerHTML = "";
    });

    const fillSearch = (term) => { dom.searchInput.value = term; dom.searchInput.focus(); };

    /* EVENTOS & INIT */
    dom.searchBtn.addEventListener("click", () => { const q = dom.searchInput.value.trim(); if (q) search.performSearch(ctx, q); });
    dom.statusPill?.addEventListener("click", () => modal.showConfigModal(ctx));

    widgetScope.addEventListener("click", e => {
      const btn = e.target.closest(".copy-code-btn");
      if (btn) render.copyCode(ctx, btn);
    });

    updateStatus(ctx);
    initTheme(ctx);
    initVoiceSearch(ctx);
    initAudioReader(ctx);
    renderHistory(ctx);
    dom.searchInput.focus();

    /* Theme toggle (sincronizado com o PainelAtende global) */
    const _themeBtn = widgetScope.querySelector("#fw-themeToggleBtn");
    if (_themeBtn) {
      _themeBtn.addEventListener("click", () => {
        const globalThemeBtn = document.getElementById("btnTheme");
        if (globalThemeBtn) {
          globalThemeBtn.click();
          const globalTheme = document.documentElement.getAttribute('data-theme') || 'light';
          ctx.widgetScope.setAttribute('data-theme', globalTheme);
          localStorage.setItem(this.lsKey('futura-theme'), globalTheme);
          ctx.theme.updateThemeButton(ctx, globalTheme);
        } else {
          toggleTheme(ctx);
        }
      });
    }

    /* Config modal */
    const _configBtn = widgetScope.querySelector("#fw-configBtn");
    if (_configBtn) _configBtn.addEventListener("click", () => modal.showConfigModal(ctx));

    /* Quick-tag buttons */
    widgetScope.querySelectorAll(".qtag").forEach(btn => {
      btn.addEventListener("click", () => fillSearch(btn.textContent.trim()));
    });

    /* Guarda referência para destroy() */
    this._searchCache = searchCache;
  }

  destroy() {
    destroyAudio();
    if (this._searchCache) this._searchCache.clear();
    if (this.container) {
      const clone = this.container.cloneNode(false);
      this.container.replaceWith(clone);
      this.container = clone;
    }
  }
}

window.FuturaSearchWidget = FuturaSearchWidget;

export { FuturaSearchWidget };
