
class FuturaSearchWidget {
  constructor(options) {
    this.containerId = options.containerId;
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error("FuturaSearchWidget: Container " + this.containerId + " not found.");
      return;
    }
    
    // Create dependencies in background
    this.loadDependencies();
    // Render UI immediately
    this.init();
  }

  loadDependencies() {
    const deps = [
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
      "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;400;500&display=swap",
      "https://cdn.jsdelivr.net/npm/marked/marked.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.8/purify.min.js"
    ];
    
    deps.forEach(dep => {
      try {
        if (dep.includes("css")) {
          const fontAwesomeExists = dep.includes("font-awesome") && document.querySelector('link[href*="font-awesome"]');
          if (!fontAwesomeExists && !document.querySelector(`link[href="${dep}"]`)) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = dep;
            document.head.appendChild(link);
          }
        } else if (dep.includes("js")) {
          if (!document.querySelector(`script[src="${dep}"]`)) {
            const script = document.createElement("script");
            script.src = dep;
            document.head.appendChild(script);
          }
        }
      } catch (e) {
        console.error("FuturaSearchWidget: Error loading dependency", e);
      }
    });
  }

  init() {
    this.injectCSS();
    this.injectHTML();
    this.initLogic();
  }

  injectCSS() {
    const styleId = "futura-widget-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `/* ============================================
   RESET
============================================ */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --bg:          #f7f6f3;
  --surface:     #ffffff;
  --surface-2:   #f2f1ee;
  --border:      #e4e2dc;
  --border-dark: #ccc9c0;
  --blue:        #1a56db;
  --blue-light:  #eff4ff;
  --blue-mid:    #3b6fd4;
  --text:        #1a1916;
  --text-2:      #4a4843;
  --muted:       #8a8780;
  --success:     #0d7f5f;
  --danger:      #b91c1c;
  --sidebar-w:   240px;
  --radius:      10px;
  --shadow-sm:   0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md:   0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
}

.futura-search-widget { scroll-behavior: smooth; font-size: 15px; }

.futura-search-widget {
  background: var(--bg);
  color: var(--text);
  font-family: 'DM Sans', sans-serif;
  font-weight: 400;
  min-height: 100vh;
  display: flex;
  -webkit-font-smoothing: antialiased;
}

/* ============================================
   SIDEBAR
============================================ */
.sidebar {
  width: var(--sidebar-w);
  min-height: 100vh;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  z-index: 10;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
  margin-bottom: 32px;
}

.logo-mark {
  width: 32px; height: 32px;
  background: var(--blue);
  color: white;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Instrument Serif', serif;
  font-size: 18px;
  flex-shrink: 0;
}

.sidebar-logo span {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  letter-spacing: -0.01em;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 28px;
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0 8px;
  margin-bottom: 6px;
  display: block;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 7px;
  font-size: 14px;
  color: var(--text-2);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover { background: var(--surface-2); color: var(--text); }
.nav-item.active { background: var(--blue-light); color: var(--blue); font-weight: 500; }
.nav-item i { font-size: 13px; }

.sidebar-history {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar-history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;
  margin-bottom: 6px;
}

.clear-btn {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
  padding: 3px 6px;
  border-radius: 5px;
  transition: color 0.15s, background 0.15s;
}

.clear-btn:hover { color: var(--danger); background: #fef2f2; }

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow-y: auto;
  flex: 1;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 7px;
  font-size: 13px;
  color: var(--muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-item:hover { background: var(--surface-2); color: var(--text-2); }
.history-item i { font-size: 11px; flex-shrink: 0; }

.sidebar-footer {
  padding-top: 16px;
  border-top: 1px solid var(--border);
  margin-top: 16px;
}

.config-btn {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 9px 10px;
  background: none;
  border: none;
  border-radius: 7px;
  color: var(--text-2);
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  text-align: left;
}

.config-btn:hover { background: var(--surface-2); color: var(--text); }
.config-btn i { font-size: 14px; }

/* ============================================
   MAIN
============================================ */
.main {
  margin-left: var(--sidebar-w);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 48px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  position: sticky;
  top: 0;
  z-index: 5;
}

.page-title {
  font-family: 'Instrument Serif', serif;
  font-size: 22px;
  font-weight: 400;
  color: var(--text);
  letter-spacing: -0.02em;
}

.page-title em {
  font-style: italic;
  color: var(--blue);
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  color: var(--muted);
  cursor: pointer;
  transition: border-color 0.2s;
}

.status-pill:hover { border-color: var(--border-dark); }

.status-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--border-dark);
  flex-shrink: 0;
}

.status-dot.active { background: var(--success); }

/* ============================================
   CONTENT
============================================ */
.content {
  padding: 56px 48px 80px;
  max-width: 860px;
}

/* ============================================
   HERO
============================================ */
.hero {
  margin-bottom: 48px;
}

.hero-sub {
  font-size: 15px;
  color: var(--muted);
  margin-bottom: 24px;
  font-weight: 300;
}

/* ============================================
   SEARCH
============================================ */
.search-wrap {
  position: relative;
  margin-bottom: 16px;
}

.search-field {
  display: flex;
  align-items: center;
  background: var(--surface);
  border: 1.5px solid var(--border-dark);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  transition: border-color 0.2s, box-shadow 0.2s;
  overflow: hidden;
}

.search-field:focus-within {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(26,86,219,0.1), var(--shadow-sm);
}

.field-icon {
  padding: 0 14px 0 18px;
  color: var(--muted);
  font-size: 15px;
  flex-shrink: 0;
}

#searchInput {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  padding: 16px 8px;
  font-size: 15px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 400;
}

#searchInput::placeholder { color: #b8b5ae; }

#searchBtn {
  background: var(--blue);
  color: white;
  border: none;
  padding: 10px 22px;
  margin: 6px;
  border-radius: 7px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  letter-spacing: 0.01em;
  transition: background 0.15s, transform 0.1s;
  flex-shrink: 0;
  white-space: nowrap;
}

#searchBtn:hover { background: var(--blue-mid); }
#searchBtn:active { transform: scale(0.98); }

/* Quick tags */
.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.qtag {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--muted);
  padding: 5px 13px;
  border-radius: 20px;
  font-size: 12.5px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.15s;
}

.qtag:hover {
  border-color: var(--blue);
  color: var(--blue);
  background: var(--blue-light);
}

/* Suggestions */
.suggestions {
  position: absolute;
  top: calc(100% + 4px);
  left: 0; right: 0;
  background: var(--surface);
  border: 1px solid var(--border-dark);
  border-radius: var(--radius);
  overflow: hidden;
  z-index: 100;
  box-shadow: var(--shadow-md);
}

.suggestions:empty { display: none; }

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  cursor: pointer;
  transition: background 0.1s;
  color: var(--text-2);
  font-size: 14px;
  border-bottom: 1px solid var(--border);
}

.suggestion-item:last-child { border-bottom: none; }
.suggestion-item:hover { background: var(--blue-light); }
.suggestion-item i { color: var(--muted); font-size: 12px; }

/* ============================================
   LOADER
============================================ */
.loader {
  padding: 32px 0;
  animation: fadeIn 0.2s ease;
}

.loader-bar {
  width: 100%;
  height: 2px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 14px;
}

.loader-fill {
  height: 100%;
  width: 40%;
  background: var(--blue);
  border-radius: 2px;
  animation: slide 1.4s ease-in-out infinite;
}

@keyframes slide {
  0%   { transform: translateX(-100%); }
  50%  { transform: translateX(150%); }
  100% { transform: translateX(350%); }
}

.loader p {
  font-size: 13px;
  color: var(--muted);
}

.hidden { display: none !important; }

/* ============================================
   AI BLOCK
============================================ */
.ai-block {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
  animation: fadeUp 0.3s ease;
}

.ai-block-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
}

.ai-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--blue-light);
  color: var(--blue);
  border: 1px solid #c3d6f8;
  padding: 3px 11px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.query-chip {
  font-size: 13px;
  color: var(--muted);
  font-style: italic;
}

.summary-body {
  padding: 24px 28px;
  font-size: 14.5px;
  line-height: 1.8;
  color: var(--text-2);
}

.summary-body p { margin-bottom: 10px; }
.summary-body p:last-child { margin-bottom: 0; }

.summary-body strong {
  color: var(--text);
  font-weight: 500;
}

.summary-body ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 12px 0;
}

.summary-body ul li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 14px;
  background: var(--surface-2);
  border-radius: 7px;
  border-left: 2px solid var(--blue);
  font-size: 14px;
}

.summary-body ul li::before {
  content: '→';
  color: var(--blue);
  flex-shrink: 0;
  font-size: 13px;
  margin-top: 1px;
}

.ai-section-title {
  font-weight: 500;
  color: var(--text);
  margin: 14px 0 6px;
  font-size: 14.5px;
}

/* ============================================
   RESULTS
============================================ */
.results {
  display: grid;
  gap: 12px;
}

.result-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px 24px;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
  animation: fadeUp 0.3s ease both;
  box-shadow: var(--shadow-sm);
}

.result-card:hover {
  border-color: var(--border-dark);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.card-meta { margin-bottom: 8px; }

.card-source {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--muted);
  background: var(--surface-2);
  padding: 3px 10px;
  border-radius: 20px;
}

.card-source i { font-size: 10px; color: var(--blue); }

.result-card h3 {
  font-size: 15px;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 6px;
  line-height: 1.4;
  font-family: 'Instrument Serif', serif;
}

.result-card p {
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.65;
  margin-bottom: 14px;
}

.card-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--blue);
  font-size: 12.5px;
  text-decoration: none;
  font-weight: 500;
  transition: gap 0.15s, opacity 0.15s;
}

.card-link:hover { opacity: 0.75; gap: 8px; }

/* No results */
.no-results {
  text-align: center;
  padding: 60px 0;
  color: var(--muted);
}

.no-results i { font-size: 32px; margin-bottom: 14px; color: var(--border-dark); display: block; }
.no-results p { font-size: 14px; }

/* ============================================
   PROVIDER CHOICE (sem API)
============================================ */
.provider-choice {
  display: grid;
  gap: 10px;
  margin-bottom: 20px;
}

.provider-btn-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  background: var(--surface-2);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s;
}

.provider-btn-card:hover {
  border-color: var(--blue);
  background: var(--blue-light);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.provider-btn-icon {
  width: 44px; height: 44px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.chatgpt-icon { background: #10a37f; color: white; }
.perplexity-icon { background: #1a6b7a; color: white; }

.provider-btn-info { flex: 1; }
.provider-btn-info strong { display: block; font-size: 14px; color: var(--text); margin-bottom: 2px; }
.provider-btn-info span { font-size: 12.5px; color: var(--muted); }
.provider-btn-arrow { color: var(--muted); font-size: 12px; }
.provider-btn-card:hover .provider-btn-arrow { color: var(--blue); }

.prompt-preview {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.prompt-preview-header {
  padding: 9px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  font-size: 11.5px;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 7px;
}

.prompt-preview-body {
  padding: 14px 16px;
  font-size: 12.5px;
  color: #9a9790;
  line-height: 1.7;
  max-height: 160px;
  overflow-y: auto;
}

.prompt-preview-body strong { color: var(--blue-mid); }

/* ============================================
   MODAL
============================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(2px);
  animation: fadeIn 0.2s ease;
}

.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 32px;
  max-width: 460px;
  width: 100%;
  animation: fadeUp 0.25s ease;
  box-shadow: var(--shadow-md);
}

.modal h3 {
  font-family: 'Instrument Serif', serif;
  font-size: 22px;
  font-weight: 400;
  margin-bottom: 6px;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal h3 i { font-size: 18px; color: var(--blue); }

.modal > p {
  color: var(--muted);
  font-size: 13.5px;
  margin-bottom: 24px;
  line-height: 1.6;
}

.modal-label {
  display: block;
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 7px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.modal input, .modal select {
  width: 100%;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  padding: 11px 14px;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  margin-bottom: 16px;
  transition: border-color 0.15s, box-shadow 0.15s;
  appearance: none;
}

.modal input:focus, .modal select:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(26,86,219,0.08);
}

.modal select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238a8780' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 36px;
  cursor: pointer;
}

.modal select option { background: white; }

.mode-cards, .provider-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.mode-card, .provider-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 16px 10px;
  background: var(--surface-2);
  border: 1.5px solid var(--border);
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}

.mode-card:hover, .provider-card:hover { border-color: var(--blue); background: var(--blue-light); }
.mode-card.selected, .provider-card.selected { border-color: var(--blue); background: var(--blue-light); }
.mode-card i, .provider-card i { font-size: 20px; color: var(--muted); margin-bottom: 2px; }
.mode-card.selected i, .provider-card.selected i { color: var(--blue); }
.mode-card strong, .provider-card strong { font-size: 13.5px; color: var(--text); }
.mode-card span, .provider-card span { font-size: 11.5px; color: var(--muted); line-height: 1.4; }

.modal-btns {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.btn-primary {
  flex: 1;
  background: var(--blue);
  color: white;
  border: none;
  padding: 11px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: background 0.15s;
  display: flex; align-items: center; justify-content: center; gap: 7px;
}

.btn-primary:hover { background: var(--blue-mid); }

.btn-secondary {
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--border);
  padding: 11px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.15s;
}

.btn-secondary:hover { border-color: var(--border-dark); color: var(--text-2); }

/* ============================================
   TOAST
============================================ */
.toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-2);
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 13.5px;
  z-index: 999;
  opacity: 0;
  transition: all 0.25s;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 9px;
  box-shadow: var(--shadow-md);
  max-width: 90vw;
}

.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

/* ============================================
   ANIMATIONS
============================================ */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ============================================
   RESPONSIVE
============================================ */
@media (max-width: 768px) {
  .sidebar { display: none; }
  .main { margin-left: 0; }
  .topbar, .content { padding-left: 20px; padding-right: 20px; }
  .content { padding-top: 32px; }
  .mode-cards, .provider-cards { grid-template-columns: 1fr; }
}

/* ============================================
   DARK THEME VARIABLES
   ============================================ */
[data-theme="dark"] {
  --bg:          #0b0c10;
  --surface:     #13151a;
  --surface-2:   #1c1e26;
  --border:      #262934;
  --border-dark: #3b3f52;
  --text:        #f3f4f6;
  --text-2:      #d1d5db;
  --muted:       #9ca3af;
  --blue:        #3b82f6;
  --blue-light:  #1e293b;
  --blue-mid:    #60a5fa;
  --shadow-sm:   0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
  --shadow-md:   0 4px 16px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.2);
}

/* ============================================
   SMOOTH COLOR TRANSITIONS
   ============================================ */
body, .sidebar, .main, .topbar, .config-btn, .status-pill, .search-field, .qtag, .ai-block, .ai-block-header, .result-card, .provider-btn-card, .prompt-preview, .modal, .mode-card, .provider-card, input, select {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

/* ============================================
   SKELETON LOADERS (SHIMMER)
   ============================================ */
.skeleton-loader {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeIn 0.3s ease;
}

.skeleton-ai-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px 28px;
  box-shadow: var(--shadow-sm);
}

.skeleton-header {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.skeleton-tag {
  width: 80px;
  height: 24px;
  border-radius: 20px;
}

.skeleton-chip {
  width: 150px;
  height: 20px;
  border-radius: 4px;
}

.skeleton-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-title {
  width: 30%;
  height: 22px;
  margin-bottom: 8px;
}

.skeleton-line {
  height: 14px;
  width: 100%;
}

.skeleton-results-grid {
  display: grid;
  gap: 12px;
}

.skeleton-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px 24px;
  box-shadow: var(--shadow-sm);
}

.skeleton-card-meta {
  width: 120px;
  height: 20px;
  border-radius: 20px;
  margin-bottom: 12px;
}

.skeleton-card-title {
  width: 40%;
  height: 18px;
  margin-bottom: 8px;
}

.skeleton-card-line {
  width: 70%;
  height: 12px;
}

.skeleton-shimmer {
  background: linear-gradient(90deg, var(--surface-2) 25%, var(--border) 50%, var(--surface-2) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* ============================================
   MARKDOWN PRO ELEMENTS
   ============================================ */
/* Inline code */
.summary-body code {
  background: var(--surface-2);
  color: var(--blue);
  font-family: monospace;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13.5px;
  border: 1px solid var(--border);
}

/* Code blocks */
.summary-body pre {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  position: relative;
  overflow-x: auto;
  margin: 14px 0;
  font-family: monospace;
}

.summary-body pre code {
  background: transparent;
  border: none;
  color: var(--text);
  padding: 0;
  border-radius: 0;
  font-size: 13px;
  display: block;
  line-height: 1.5;
}

/* Floating copy button */
.copy-code-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--muted);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 5px;
  box-shadow: var(--shadow-sm);
  z-index: 10;
}

.copy-code-btn:hover {
  background: var(--blue-light);
  border-color: var(--blue);
  color: var(--blue);
}

/* Tables */
.summary-body table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 13.5px;
  background: var(--surface);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
}

.summary-body th, .summary-body td {
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.summary-body th {
  background: var(--surface-2);
  font-weight: 600;
  color: var(--text);
}

.summary-body tr:last-child td {
  border-bottom: none;
}

.summary-body tr:nth-child(even) {
  background: var(--bg);
}

/* ============================================
   VOICE SEARCH BUTTON & MICROPHONE PULSE
   ============================================ */
.voice-search-btn {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 10px;
  font-size: 15px;
  transition: all 0.15s ease;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
}

.voice-search-btn:hover {
  color: var(--blue);
  background: var(--blue-light);
}

.voice-search-btn.listening {
  color: var(--danger);
  background: #fef2f2;
  animation: pulseMic 1.2s infinite ease-in-out;
}

@keyframes pulseMic {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(185, 28, 28, 0.4); }
  50% { transform: scale(1.08); box-shadow: 0 0 0 8px rgba(185, 28, 28, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(185, 28, 28, 0); }
}

/* ============================================
   AUDIO READ ALOUD BUTTON
   ============================================ */
.ai-block-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
}

.audio-read-btn {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-2);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto; /* push to the far right */
}

.audio-read-btn:hover {
  border-color: var(--blue);
  color: var(--blue);
  background: var(--blue-light);
}

.audio-read-btn.playing {
  background: var(--success);
  color: white;
  border-color: var(--success);
}

/* ============================================
   CITATION BADGES (ESTILO PERPLEXITY)
   ============================================ */
.citation-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--blue-light);
  color: var(--blue);
  border: 1px solid #c3d6f8;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 10px;
  font-weight: 600;
  text-decoration: none;
  margin: 0 2px;
  vertical-align: super;
  transition: all 0.15s ease;
}

.citation-badge:hover {
  background: var(--blue);
  color: white;
  border-color: var(--blue);
  transform: scale(1.1);
}

/* WIDGET SPECIFIC OVERRIDES */
.futura-search-widget {
  position: relative !important;
  height: 800px;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  margin: 20px 0;
  border: 1px solid var(--border);
}
.futura-search-widget .sidebar {
  position: absolute;
  top: 0; left: 0; bottom: 0;
  min-height: auto;
}
.futura-search-widget .main {
  height: 100%;
  overflow-y: auto;
}
`;
      document.head.appendChild(style);
    }
  }

  injectHTML() {
    this.container.classList.add('futura-search-widget');
    this.container.innerHTML = `

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
        <button id="clearFuturaHistory" class="clear-btn" title="Limpar histórico"><i class="fa-solid fa-trash-can"></i></button>
      </div>
      <div id="historyList" class="history-list"></div>
    </div>

    <div class="sidebar-footer">
      <button class="config-btn" id="themeToggleBtn" style="margin-bottom: 6px;">
        <i class="fa-solid fa-moon"></i>
        <span>Tema Escuro</span>
      </button>
      <button class="config-btn" id="configBtn">
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
        <div id="statusPill" class="status-pill">
          <div class="status-dot"></div>
          <span id="statusLabel">Não configurado</span>
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
              id="searchInput"
              placeholder="Como faço uma remessa de mercadoria?"
              autocomplete="off"
              spellcheck="false"
            />
            <button id="voiceSearchBtn" class="voice-search-btn" title="Pesquisar por voz">
              <i class="fa-solid fa-microphone"></i>
            </button>
            <button id="searchBtn">Pesquisar</button>
          </div>
          <div id="suggestions" class="suggestions"></div>
        </div>

        <div class="quick-tags">
          <button class="qtag">limite de desconto</button>
          <button class="qtag">emissão de nfe</button>
          <button class="qtag">controle de estoque</button>
          <button class="qtag">comissão de vendedor</button>
          <button class="qtag">fechamento de caixa</button>
        </div>
      </section>

      <div id="loader" class="loader hidden">
        <div class="loader-bar"><div class="loader-fill"></div></div>
        <p id="loaderText">Pesquisando no manual...</p>
      </div>

      <div id="skeletonLoader" class="skeleton-loader hidden">
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

      <section id="aiBlock" class="ai-block hidden">
        <div class="ai-block-header">
          <div class="ai-tag"><i class="fa-solid fa-wand-magic-sparkles"></i> Resposta</div>
          <span id="queryLabel" class="query-chip"></span>
          <button id="audioReadBtn" class="audio-read-btn" title="Ouvir resposta">
            <i class="fa-solid fa-volume-high"></i> <span>Ouvir</span>
          </button>
        </div>
        <div id="summaryContent" class="summary-body"></div>
      </section>

      <section id="results" class="results"></section>

    </div>
  </main>

  
  
  
`;
  }

  initLogic() {
    const widgetScope = this.container;
    
    // Encapsulate original JS logic, scoped to widgetScope
    (function(document, window) {
/* =====================================================
   FUTURA SEARCH AI — script.js
   Modo 1: Sem API — abre ChatGPT ou Perplexity
   Modo 2: Com API — Gemini ou OpenAI direto no sistema
===================================================== */

const TARGET_DOMAIN = "manual.futurasistemas.com.br";

let CONFIG = {
  mode:     localStorage.getItem("futura-mode") || "noapi",
  provider: localStorage.getItem("futura-provider") || "",
  apiKey:   localStorage.getItem("futura-apikey") || "",
};

const SUGGESTIONS = [
  "limite de desconto","cadastro de clientes","tabela de preço",
  "pedido mobile","vendedor padrão","controle de estoque",
  "romaneio de entrega","comissão de vendedor","contas a pagar",
  "contas a receber","duplicatas","ordem de serviço",
  "emissão de nfe","backup do sistema","replicador de dados",
  "cadastro de produto","grade de produto","parametrização fiscal",
  "relatório de vendas","fluxo de caixa","fechamento de caixa",
  "permissão de acesso","cadastro de fornecedor","entrada de mercadoria",
  "remessa de mercadoria","atualização de estoque","devolução de venda",
  "sangria de caixa","reforço de caixa","pedido de compra",
];

const searchInput      = document.getElementById("searchInput");
const searchBtn        = document.getElementById("searchBtn");
const resultsContainer = document.getElementById("results");
const loaderEl         = document.getElementById("loader");
const loaderText       = document.getElementById("loaderText");
const skeletonLoader   = document.getElementById("skeletonLoader");
const voiceSearchBtn   = document.getElementById("voiceSearchBtn");
const audioReadBtn     = document.getElementById("audioReadBtn");
const historyList      = document.getElementById("historyList");
const clearHistoryBtn  = document.getElementById("clearHistory");
const suggestionsBox   = document.getElementById("suggestions");
const aiBlock          = document.getElementById("aiBlock");
const summaryContent   = document.getElementById("summaryContent");
const queryLabel       = document.getElementById("queryLabel");
const statusPill       = document.getElementById("statusPill");
const statusLabel      = document.getElementById("statusLabel");

const searchCache      = new Map();
let currentResults     = [];

/* =====================================================
   STATUS PILL
===================================================== */
function updateStatus() {
  const dot = statusPill?.querySelector(".status-dot");
  const modeLabels = {
    noapi: "Modo: Sem API",
    api: CONFIG.provider === "openai" ? "ChatGPT API" : "Gemini API",
  };
  const active = CONFIG.mode === "noapi" || (CONFIG.mode === "api" && CONFIG.apiKey);
  if (dot) dot.classList.toggle("active", active);
  if (statusLabel) statusLabel.textContent = active ? modeLabels[CONFIG.mode] : "Não configurado";
}

/* =====================================================
   TEMA ESCURO / CLARO
===================================================== */
function initTheme() {
  const currentTheme = localStorage.getItem("futura-theme") || "light";
  document.body.setAttribute("data-theme", currentTheme);
  updateThemeButton(currentTheme);
}

function updateThemeButton(theme) {
  const themeBtn = document.getElementById("themeToggleBtn");
  if (!themeBtn) return;
  const icon = themeBtn.querySelector("i");
  const text = themeBtn.querySelector("span");
  if (theme === "dark") {
    if (icon) icon.className = "fa-solid fa-sun";
    if (text) text.textContent = "Tema Claro";
  } else {
    if (icon) icon.className = "fa-solid fa-moon";
    if (text) text.textContent = "Tema Escuro";
  }
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
  document.body.setAttribute("data-theme", currentTheme);
  localStorage.setItem("futura-theme", currentTheme);
  updateThemeButton(currentTheme);
  showToast(currentTheme === "dark" ? "Tema escuro ativado." : "Tema claro ativado.", "success");
}

/* =====================================================
   MODAL DE CONFIGURAÇÃO
===================================================== */
function showConfigModal() {
  document.getElementById("configModal")?.remove();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "configModal";
  overlay.innerHTML = `
    <div class="modal">
      <h3><i class="fa-solid fa-gear"></i> Configurações</h3>
      <p>Escolha como o sistema vai responder suas dúvidas sobre o manual.</p>

      <label class="modal-label">Modo de funcionamento</label>
      <div class="mode-cards">
        <div class="mode-card ${CONFIG.mode === 'noapi' ? 'selected' : ''}" data-mode="noapi">
          <i class="fa-solid fa-bolt"></i>
          <strong>Sem API</strong>
          <span>Gratuito — abre ChatGPT ou Perplexity</span>
        </div>
        <div class="mode-card ${CONFIG.mode === 'api' ? 'selected' : ''}" data-mode="api">
          <i class="fa-solid fa-microchip"></i>
          <strong>Com API</strong>
          <span>Responde direto no sistema</span>
        </div>
      </div>

      <div id="api-section" style="display:${CONFIG.mode === 'api' ? 'block' : 'none'}">
        <div style="border-top:1px solid var(--border);margin:4px 0 20px"></div>

        <label class="modal-label">Provedor de IA</label>
        <div class="provider-cards">
          <div class="provider-card ${CONFIG.provider === 'gemini' ? 'selected' : ''}" data-provider="gemini">
            <i class="fa-brands fa-google"></i>
            <strong>Gemini</strong>
            <span>Google — Gratuito*</span>
          </div>
          <div class="provider-card ${CONFIG.provider === 'openai' ? 'selected' : ''}" data-provider="openai">
            <i class="fa-solid fa-robot"></i>
            <strong>ChatGPT</strong>
            <span>OpenAI — Pago</span>
          </div>
        </div>

        <label class="modal-label">Chave da API</label>
        <div style="position:relative">
          <input type="password" id="inp-apikey"
            placeholder="${CONFIG.provider === 'openai' ? 'sk-...' : 'AIzaSy...'}"
            value="${CONFIG.apiKey}"
            style="padding-right:46px;margin-bottom:4px" />
          <button type="button" id="toggleKeyBtn"
            style="position:absolute;right:12px;top:12px;background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px;padding:2px">
            <i class="fa-solid fa-eye"></i>
          </button>
        </div>
        <p style="font-size:12px;color:var(--muted);margin-bottom:16px" id="key-hint">
          ${CONFIG.provider === 'openai'
            ? 'Obtenha em: <a href="https://platform.openai.com/api-keys" target="_blank" style="color:var(--blue)">platform.openai.com</a>'
            : 'Obtenha em: <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--blue)">aistudio.google.com</a>'}
        </p>
      </div>

      <div class="modal-btns">
        <button class="btn-secondary" id="cancelConfigBtn">Cancelar</button>
        <button class="btn-primary" id="saveConfigBtn">
          <i class="fa-solid fa-floppy-disk"></i> Salvar
        </button>
      </div>
    </div>`;

  // Bind events via addEventListener (sem onclick inline)
  overlay.addEventListener("click", e => { if (e.target === overlay) closeConfigModal(); });

  overlay.querySelectorAll(".mode-card").forEach(card => {
    card.addEventListener("click", () => selectMode(card.dataset.mode, card));
  });

  overlay.querySelectorAll(".provider-card").forEach(card => {
    card.addEventListener("click", () => selectProvider(card.dataset.provider, card));
  });

  const toggleKeyBtn = overlay.querySelector("#toggleKeyBtn");
  if (toggleKeyBtn) {
    toggleKeyBtn.addEventListener("click", () => toggleKey("inp-apikey", toggleKeyBtn));
  }

  const cancelBtn = overlay.querySelector("#cancelConfigBtn");
  if (cancelBtn) cancelBtn.addEventListener("click", closeConfigModal);

  const saveBtn = overlay.querySelector("#saveConfigBtn");
  if (saveBtn) saveBtn.addEventListener("click", saveConfig);

  document.body.appendChild(overlay);
}

function selectMode(mode, el) {
  document.querySelectorAll(".mode-card").forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");
  const sec = document.getElementById("api-section");
  if (sec) sec.style.display = mode === "api" ? "block" : "none";
}

function selectProvider(provider, el) {
  document.querySelectorAll(".provider-card").forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");
  const inp = document.getElementById("inp-apikey");
  if (inp) { inp.placeholder = provider === "openai" ? "sk-..." : "AIzaSy..."; inp.value = ""; }
  const hint = document.getElementById("key-hint");
  if (hint) hint.innerHTML = provider === "openai"
    ? 'Obtenha em: <a href="https://platform.openai.com/api-keys" target="_blank" style="color:var(--blue)">platform.openai.com</a>'
    : 'Obtenha em: <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--blue)">aistudio.google.com</a>';
}

function toggleKey(id, btn) {
  const inp = document.getElementById(id);
  if (!inp) return;
  const hidden = inp.type === "password";
  inp.type = hidden ? "text" : "password";
  btn.innerHTML = hidden ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
}

function closeConfigModal() { document.getElementById("configModal")?.remove(); }

function saveConfig() {
  const modeEl     = document.querySelector(".mode-card.selected");
  const providerEl = document.querySelector(".provider-card.selected");
  const modeCards  = document.querySelectorAll(".mode-card");

  CONFIG.mode = modeEl
    ? (modeEl === modeCards[0] ? "noapi" : "api")
    : CONFIG.mode;

  if (CONFIG.mode === "api") {
    const provCards = document.querySelectorAll(".provider-card");
    CONFIG.provider = providerEl
      ? (providerEl === provCards[0] ? "gemini" : "openai")
      : CONFIG.provider;
    CONFIG.apiKey = document.getElementById("inp-apikey")?.value.trim() || "";
    if (!CONFIG.provider) { showToast("Selecione Gemini ou ChatGPT.", "info"); return; }
    if (!CONFIG.apiKey)   { showToast("Informe a chave da API.", "info"); return; }
  }

  localStorage.setItem("futura-mode",     CONFIG.mode);
  localStorage.setItem("futura-provider", CONFIG.provider);
  localStorage.setItem("futura-apikey",   CONFIG.apiKey);

  searchCache.clear();
  updateStatus();
  closeConfigModal();
  showToast("Configurações salvas.", "success");
}

/* =====================================================
   TOAST
===================================================== */
function showToast(message, type = "info") {
  let toast = document.getElementById("toast");
  if (!toast) { toast = document.createElement("div"); toast.id = "toast"; toast.className = "toast"; document.body.appendChild(toast); }
  const icons   = { error: "fa-circle-exclamation", success: "fa-circle-check", info: "fa-circle-info" };
  toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}" style="color:${type==='success'?'var(--success)':type==='error'?'var(--danger)':'var(--blue)'}"></i> ${message}`;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3200);
}

/* =====================================================
   HISTÓRICO
===================================================== */
function loadHistory() {
  const h = getHistory();
  historyList.innerHTML = "";
  if (h.length === 0) {
    historyList.innerHTML = `<span style="color:var(--muted);font-size:12px;padding:6px 10px;display:block">Nenhuma pesquisa ainda</span>`;
    return;
  }
  [...h].reverse().slice(0, 20).forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `<i class="fa-solid fa-clock"></i><span style="overflow:hidden;text-overflow:ellipsis">${item}</span>`;
    div.onclick = () => { searchInput.value = item; performSearch(item); };
    historyList.appendChild(div);
  });
}

function getHistory() { return JSON.parse(localStorage.getItem("futura-history") || "[]"); }

function saveHistory(query) {
  let h = getHistory().filter(x => x !== query);
  h.push(query);
  if (h.length > 50) h = h.slice(-50);
  localStorage.setItem("futura-history", JSON.stringify(h));
  loadHistory();
}

clearHistoryBtn?.addEventListener("click", () => {
  localStorage.removeItem("futura-history");
  loadHistory();
  showToast("Histórico limpo.", "info");
});

/* =====================================================
   AUTOCOMPLETE
===================================================== */
searchInput.addEventListener("input", () => {
  const val = searchInput.value.toLowerCase().trim();
  suggestionsBox.innerHTML = "";
  if (!val || val.length < 2) return;
  SUGGESTIONS.filter(s => s.toLowerCase().includes(val)).slice(0, 6).forEach(item => {
    const div = document.createElement("div");
    div.className = "suggestion-item";
    const idx = item.toLowerCase().indexOf(val);
    div.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i>`
      + item.slice(0, idx)
      + `<strong>${item.slice(idx, idx + val.length)}</strong>`
      + item.slice(idx + val.length);
    div.onclick = () => { searchInput.value = item; suggestionsBox.innerHTML = ""; performSearch(item); };
    suggestionsBox.appendChild(div);
  });
});

document.addEventListener("click", e => { if (!e.target.closest(".search-wrap")) suggestionsBox.innerHTML = ""; });
searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter")  { suggestionsBox.innerHTML = ""; performSearch(searchInput.value.trim()); }
  if (e.key === "Escape") suggestionsBox.innerHTML = "";
});

function fillSearch(term) { searchInput.value = term; searchInput.focus(); }

/* =====================================================
   BUSCA PRINCIPAL
===================================================== */
async function performSearch(query) {
  if (!query) return;
  stopAudioReading(); // Parar qualquer áudio ativo ao buscar novamente

  CONFIG.mode     = localStorage.getItem("futura-mode") || "noapi";
  CONFIG.provider = localStorage.getItem("futura-provider") || "";
  CONFIG.apiKey   = localStorage.getItem("futura-apikey") || "";

  saveHistory(query);
  suggestionsBox.innerHTML = "";
  resultsContainer.innerHTML = "";
  aiBlock.classList.add("hidden");

  if (CONFIG.mode === "noapi") {
    showProviderChoice(query);
    aiBlock.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } else {
    if (!CONFIG.provider || !CONFIG.apiKey) { showConfigModal(); showToast("Configure a API primeiro.", "info"); return; }
    
    // Checagem de Cache Local
    const cacheKey = query.toLowerCase().trim();
    if (searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey);
      showToast("Carregado instantaneamente do cache local.", "success");
      currentResults = cached.results; // Salva referências para citações
      if (cached.results.length > 0) renderResults(cached.results);
      showExplanation(query, cached.explanation);
      return;
    }

    await searchWithAPI(query);
  }
}

/* =====================================================
   MODO SEM API
===================================================== */
function buildPrompt(query) {
  return `Pesquise APENAS no site ${TARGET_DOMAIN} e responda a seguinte dúvida sobre o ERP Futura Sistemas:\n\n"${query}"\n\nLeia os artigos encontrados e responda de forma clara e objetiva:\n\n**Resposta direta:** (responda a pergunta)\n\n**Como funciona no sistema:** (passo a passo)\n\n**Onde configurar:** (Menu > Módulo > Tela)\n\n**Dicas importantes:** (pontos de atenção e boas práticas)\n\nResponda em português brasileiro.`;
}

function escapeQ(str) { return str.replace(/'/g, "\\'").replace(/"/g, "&quot;"); }
function openChatGPT(q)    { window.open("https://chatgpt.com/?q=" + encodeURIComponent(buildPrompt(q)), "_blank"); }
function openPerplexity(q) { window.open("https://www.perplexity.ai/search?q=" + encodeURIComponent(buildPrompt(q)), "_blank"); }

function showProviderChoice(query) {
  queryLabel.textContent = `"${query}"`;
  aiBlock.classList.remove("hidden");
  summaryContent.innerHTML = `
    <p style="font-size:13.5px;color:var(--muted);margin-bottom:18px">
      Escolha onde pesquisar. A pergunta já vai formatada para buscar no manual da Futura:
    </p>
    <div class="provider-choice">
      <div class="provider-btn-card" data-action="open-chatgpt" data-query="${escapeQ(query)}">
        <div class="provider-btn-icon chatgpt-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073z"/></svg>
        </div>
        <div class="provider-btn-info">
          <strong>Abrir no ChatGPT</strong>
          <span>Gratuito — abre com a pergunta pronta</span>
        </div>
        <i class="fa-solid fa-arrow-up-right-from-square provider-btn-arrow"></i>
      </div>
      <div class="provider-btn-card" data-action="open-perplexity" data-query="${escapeQ(query)}">
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
      <div class="prompt-preview-body">${buildPrompt(query).replace(/\n/g,"<br>").replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")}</div>
    </div>`;

  // Bind provider buttons after rendering
  widgetScope.querySelectorAll("[data-action='open-chatgpt']").forEach(btn => {
    btn.addEventListener("click", () => openChatGPT(btn.dataset.query));
  });
  widgetScope.querySelectorAll("[data-action='open-perplexity']").forEach(btn => {
    btn.addEventListener("click", () => openPerplexity(btn.dataset.query));
  });
}

/* =====================================================
   MODO COM API
===================================================== */
async function searchWithAPI(query) {
  setLoader(true, "Pesquisando no manual...");
  loaderEl.scrollIntoView({ behavior: "smooth", block: "nearest" });

  try {
    let response;
    if (CONFIG.provider === "gemini") response = await callGemini(query);
    else response = await callOpenAI(query);

    setLoader(false);
    if (!response.explanation && response.results.length === 0) { renderNoResults(query); return; }
    
    // Armazenar resposta no cache local
    searchCache.set(query.toLowerCase().trim(), response);
    currentResults = response.results; // Salva referências para citações

    if (response.results.length > 0) renderResults(response.results);
    showExplanation(query, response.explanation);
  } catch (err) {
    setLoader(false);
    showToast(err.message, "error");
    renderError(query, err.message);
  }
}

function buildAPIPrompt(query) {
  return `Você é especialista no ERP Futura Sistemas. Pesquise em ${TARGET_DOMAIN} sobre: "${query}"\n\nResponda em português com esta estrutura:\n\n**Resposta direta:**\n\n**Como funciona:**\n\n**Onde configurar:**\n\n**Dicas importantes:**`;
}

async function callGemini(query) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${CONFIG.apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: buildAPIPrompt(query) }] }], tools: [{ google_search: {} }], generationConfig: { maxOutputTokens: 2000, temperature: 0.3 } }),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e?.error?.message || `Gemini: erro ${res.status}`); }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const chunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const results = chunks.filter(c => c.web?.uri?.includes(TARGET_DOMAIN)).map(c => ({ title: c.web.title || "Artigo", link: c.web.uri, description: "" }));
  return { results, explanation: text };
}

async function callOpenAI(query) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${CONFIG.apiKey}` },
    body: JSON.stringify({ 
      model: "gpt-4o-mini", 
      messages: [{ role: "user", content: buildAPIPrompt(query) }] 
    }),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e?.error?.message || `OpenAI: erro ${res.status}`); }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  return { results: [], explanation: text };
}

/* =====================================================
   RENDER
===================================================== */
function showExplanation(query, text) {
  queryLabel.textContent = `"${query}"`;
  aiBlock.classList.remove("hidden");
  summaryContent.innerHTML = formatResponse(text);
  aiBlock.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function formatResponse(text) {
  text = text.replace(/\*\*Páginas encontradas:\*\*[\s\S]*$/i, "").trim();
  
  // Converter marcas de citação tipo [1], [^1^] ou [^1] em badges
  text = text.replace(/\[\^?(\d+)\^?\]/g, (match, num) => {
    const idx = parseInt(num, 10) - 1;
    if (currentResults && currentResults[idx]) {
      const article = currentResults[idx];
      return `<a href="${article.link}" target="_blank" class="citation-badge" title="${article.title}">${num}</a>`;
    }
    return match;
  });

  // Utilizar marked para converter de Markdown para HTML
  let rawHtml = marked.parse(text);
  
  // Adicionar botão de cópia aos blocos de código
  rawHtml = rawHtml.replace(/<pre><code(.*?)>([\s\S]*?)<\/code><\/pre>/g, (match, attrs, code) => {
    return `<pre><code${attrs}>${code}</code><button class="copy-code-btn"><i class="fa-solid fa-copy"></i> <span>Copiar</span></button></pre>`;
  });

  // Sanitizar o HTML contra ataques XSS permitindo atributo target
  return DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['target'] });
}

function copyCode(btn) {
  const codeEl = btn.previousElementSibling;
  if (!codeEl) return;
  const text = codeEl.textContent;
  navigator.clipboard.writeText(text).then(() => {
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check" style="color:var(--success)"></i> <span>Copiado!</span>';
    btn.style.borderColor = "var(--success)";
    btn.style.color = "var(--success)";
    
    showToast("Código copiado.", "success");
    
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.style.borderColor = "";
      btn.style.color = "";
    }, 2000);
  }).catch(() => {
    showToast("Falha ao copiar.", "error");
  });
}

function renderResults(results) {
  currentResults = results;
  resultsContainer.innerHTML = "";
  results.forEach((r, i) => {
    const card = document.createElement("div");
    card.className = "result-card"; card.style.animationDelay = `${i*0.06}s`;
    let bc = ""; try { bc = new URL(r.link).pathname.split("/").filter(Boolean).join(" › "); } catch {}
    card.innerHTML = `
      <div class="card-meta"><div class="card-source"><i class="fa-solid fa-book-open"></i> ${bc||TARGET_DOMAIN}</div></div>
      <h3>${r.title}</h3>
      ${r.description?`<p>${r.description}</p>`:""}
      <a class="card-link" href="${r.link}" target="_blank" rel="noopener">Abrir artigo <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`;
    resultsContainer.appendChild(card);
  });
}

function renderNoResults(query) {
  resultsContainer.innerHTML = `<div class="no-results"><i class="fa-solid fa-magnifying-glass"></i><p>Nenhum resultado encontrado para <strong>"${query}"</strong>.</p></div>`;
}

function renderError(query, msg) {
  resultsContainer.innerHTML = `<div class="no-results"><i class="fa-solid fa-circle-exclamation" style="color:var(--danger)"></i><p>Erro ao pesquisar <strong>"${query}"</strong>.<br><small style="color:var(--muted)">${msg}</small></p></div>`;
}

function setLoader(visible, msg="Aguarde...") {
  loaderEl?.classList.toggle("hidden", !visible);
  skeletonLoader?.classList.toggle("hidden", !visible);
  if (loaderText) loaderText.textContent = msg;
}

/* =====================================================
   BUSCA POR VOZ (SPEECH TO TEXT)
===================================================== */
function initVoiceSearch() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (voiceSearchBtn) {
      voiceSearchBtn.style.opacity = "0.5";
      voiceSearchBtn.style.cursor = "not-allowed";
      voiceSearchBtn.title = "Busca por voz indisponível neste navegador";
      voiceSearchBtn.addEventListener("click", () => {
        showToast("A busca por voz requer um navegador compatível (como Google Chrome ou Microsoft Edge) e uma conexão segura (HTTPS).", "error");
      });
    }
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  let isListening = false;

  voiceSearchBtn.addEventListener("click", () => {
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  });

  recognition.onstart = () => {
    isListening = true;
    voiceSearchBtn.classList.add("listening");
    voiceSearchBtn.title = "Ouvindo... Clique para parar";
    searchInput.placeholder = "Ouvindo sua dúvida...";
    searchInput.value = "";
    showToast("Reconhecimento de voz ativado. Fale sua dúvida.", "info");
  };

  recognition.onend = () => {
    isListening = false;
    voiceSearchBtn.classList.remove("listening");
    voiceSearchBtn.title = "Pesquisar por voz";
    searchInput.placeholder = "Como faço uma remessa de mercadoria?";
  };

  recognition.onresult = (event) => {
    const speechResult = event.results[0][0].transcript;
    searchInput.value = speechResult;
    showToast(`Pesquisando por: "${speechResult}"`, "success");
    performSearch(speechResult);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error", event.error);
    if (event.error !== "no-speech") {
      showToast("Não consegui te ouvir claramente.", "error");
    }
  };
}

/* =====================================================
   LEITOR DE RESPOSTAS (TEXT TO SPEECH)
===================================================== */
let isReading = false;
let currentUtterance = null;

function initAudioReader() {
  if (!audioReadBtn) return;
  audioReadBtn.addEventListener("click", toggleAudioReading);
}

function toggleAudioReading() {
  if (!window.speechSynthesis) {
    showToast("Leitura por voz não suportada neste navegador.", "error");
    return;
  }

  if (isReading) {
    stopAudioReading();
    return;
  }

  // Extrair o texto limpo da div summaryContent
  const textToRead = summaryContent ? summaryContent.innerText.trim() : "";
  if (!textToRead) {
    showToast("Não há resposta para ler.", "info");
    return;
  }

  // Quebrar o texto longo em pedaços para evitar o bug do Chrome que corta o áudio
  const chunks = textToRead.match(/[^.!?]+[.!?]+/g) || [textToRead];
  let currentChunkIndex = 0;
  isReading = true;

  function speakNextChunk() {
    if (currentChunkIndex >= chunks.length || !isReading) {
      resetAudioReaderState();
      return;
    }

    currentUtterance = new SpeechSynthesisUtterance(chunks[currentChunkIndex].trim());
    currentUtterance.lang = "pt-BR";
    
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.includes("PT") || v.lang.includes("pt-BR") || v.lang.includes("pt_BR"));
    if (ptVoice) {
      currentUtterance.voice = ptVoice;
    }

    currentUtterance.onstart = () => {
      if (currentChunkIndex === 0) {
        audioReadBtn.classList.add("playing");
        audioReadBtn.innerHTML = '<i class="fa-solid fa-circle-stop"></i> <span>Parar</span>';
        showToast("Lendo resposta do manual...", "info");
      }
    };

    currentUtterance.onend = () => {
      currentChunkIndex++;
      speakNextChunk();
    };

    currentUtterance.onerror = (e) => {
      console.error("Synthesis error", e);
      resetAudioReaderState();
    };

    window.speechSynthesis.speak(currentUtterance);
  }

  speakNextChunk();
}

function stopAudioReading() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  resetAudioReaderState();
}

function resetAudioReaderState() {
  isReading = false;
  currentUtterance = null;
  if (audioReadBtn) {
    audioReadBtn.classList.remove("playing");
    audioReadBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> <span>Ouvir</span>';
  }
}

/* =====================================================
   EVENTOS & INIT
===================================================== */
searchBtn.addEventListener("click", () => { const q = searchInput.value.trim(); if (q) performSearch(q); });
statusPill?.addEventListener("click", showConfigModal);

document.addEventListener("click", e => {
  const btn = e.target.closest(".copy-code-btn");
  if (btn) copyCode(btn);
});

updateStatus();
initTheme();
initVoiceSearch();
initAudioReader();
loadHistory();
searchInput.focus();


      // ── Reconnect buttons that had inline onclick removed ──
      // Theme toggle
      const _themeBtn = document.getElementById("themeToggleBtn");
      if (_themeBtn) _themeBtn.addEventListener("click", toggleTheme);

      // Config modal
      const _configBtn = document.getElementById("configBtn");
      if (_configBtn) _configBtn.addEventListener("click", showConfigModal);

      // Quick-tag buttons
      widgetScope.querySelectorAll(".qtag").forEach(btn => {
        btn.addEventListener("click", () => fillSearch(btn.textContent.trim()));
      });

    })( 
      {
        getElementById: (id) => widgetScope.querySelector("#" + id),
        querySelector: (sel) => widgetScope.querySelector(sel),
        querySelectorAll: (sel) => widgetScope.querySelectorAll(sel),
        addEventListener: document.addEventListener.bind(document),
        body: widgetScope,
        createElement: document.createElement.bind(document),
        head: document.head
      }, 
      window
    );
  }
}

window.FuturaSearchWidget = FuturaSearchWidget;
