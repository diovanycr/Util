/**
 * futura-widget-template.js — HTML do widget (sidebar + main + content)
 */

export const WIDGET_HTML = `
  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="logo-mark">F</div>
      <span>Futura ERP</span>
    </div>

    <nav class="sidebar-nav">
      <span class="nav-label">Pesquisa</span>
      <a class="nav-item active" href="#"><i class="fa-solid fa-book"></i> Manual</a>
    </nav>

    <div class="sidebar-history">
      <div class="sidebar-history-header">
        <span class="nav-label">Histórico</span>
        <button id="fw-clearFuturaHistory" class="clear-btn" title="Limpar histórico"><i class="fa-solid fa-trash-can"></i></button>
      </div>
      <div id="fw-historyList" class="history-list"></div>
    </div>

    <div class="sidebar-footer">
      <button class="config-btn" id="fw-themeToggleBtn" style="margin-bottom: 6px;">
        <i class="fa-solid fa-moon"></i>
        <span>Tema Escuro</span>
      </button>
      <button class="config-btn" id="fw-configBtn">
        <i class="fa-solid fa-gear"></i>
        <span>Configurações</span>
      </button>
    </div>
  </aside>

  <main class="main">

    <header class="topbar">
      <div class="topbar-left">
        <h1 class="page-title">Manual <em>Futura Sistemas</em></h1>
      </div>
      <div class="topbar-right">
        <div id="fw-statusPill" class="status-pill">
          <div class="status-dot"></div>
          <span id="fw-statusLabel">Não configurado</span>
        </div>
      </div>
    </header>

    <div class="content">

      <section class="hero">
        <p class="hero-sub">Tire dúvidas sobre o ERP com linguagem clara e objetiva.</p>

        <div class="search-wrap">
          <div class="search-field" id="searchWrapper">
            <i class="fa-solid fa-magnifying-glass field-icon"></i>
            <input
              type="text"
              id="fw-searchInput"
              placeholder="Como faço uma remessa de mercadoria?"
              autocomplete="off"
              spellcheck="false"
            />
            <button id="fw-voiceSearchBtn" class="voice-search-btn" title="Pesquisar por voz">
              <i class="fa-solid fa-microphone"></i>
            </button>
            <button id="fw-searchBtn">Pesquisar</button>
          </div>
          <div id="fw-suggestions" class="suggestions"></div>
        </div>

        <div class="quick-tags">
          <button class="qtag">limite de desconto</button>
          <button class="qtag">emissão de nfe</button>
          <button class="qtag">controle de estoque</button>
          <button class="qtag">comissão de vendedor</button>
          <button class="qtag">fechamento de caixa</button>
        </div>
      </section>

      <div id="fw-loader" class="loader fw-hidden">
        <div class="loader-bar"><div class="loader-fill"></div></div>
        <p id="fw-loaderText">Pesquisando no manual...</p>
      </div>

      <div id="fw-skeletonLoader" class="skeleton-loader fw-hidden">
        <div class="skeleton-ai-card">
          <div class="skeleton-header">
            <div class="skeleton-shimmer skeleton-tag"></div>
            <div class="skeleton-shimmer skeleton-chip"></div>
          </div>
          <div class="skeleton-body">
            <div class="skeleton-shimmer skeleton-title"></div>
            <div class="skeleton-shimmer skeleton-line"></div>
            <div class="skeleton-shimmer skeleton-line" style="width: 85%;"></div>
            <div class="skeleton-shimmer skeleton-line" style="width: 70%;"></div>
            <div class="skeleton-shimmer skeleton-line" style="width: 45%;"></div>
          </div>
        </div>
        <div class="skeleton-results-grid">
          <div class="skeleton-card">
            <div class="skeleton-shimmer skeleton-card-meta"></div>
            <div class="skeleton-shimmer skeleton-card-title"></div>
            <div class="skeleton-shimmer skeleton-card-line"></div>
          </div>
          <div class="skeleton-card">
            <div class="skeleton-shimmer skeleton-card-meta"></div>
            <div class="skeleton-shimmer skeleton-card-title"></div>
            <div class="skeleton-shimmer skeleton-card-line"></div>
          </div>
        </div>
      </div>

      <section id="fw-aiBlock" class="ai-block fw-hidden">
        <div class="ai-block-header">
          <div class="ai-tag"><i class="fa-solid fa-wand-magic-sparkles"></i> Resposta</div>
          <span id="fw-queryLabel" class="query-chip"></span>
          <button id="fw-audioReadBtn" class="audio-read-btn" title="Ouvir resposta">
            <i class="fa-solid fa-volume-high"></i> <span>Ouvir</span>
          </button>
        </div>
        <div id="fw-summaryContent" class="summary-body"></div>
      </section>

      <section id="fw-results" class="results"></section>

    </div>
  </main>

`;
