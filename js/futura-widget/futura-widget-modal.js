/**
 * futura-widget-modal.js — Modal de configuração (modo, provedor, API key)
 */

export function showConfigModal(ctx) {
  const { widgetScope, config } = ctx;
  document.getElementById("fw-configModal")?.remove();

  const prevFocus = document.activeElement;
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "fw-configModal";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Configurações do Futura Search");
  overlay.innerHTML = `
    <div class="modal">
      <h3><i class="fa-solid fa-gear"></i> Configurações</h3>
      <p>Escolha como o sistema vai responder suas dúvidas sobre o manual.</p>

      <label class="modal-label">Modo de funcionamento</label>
      <div class="mode-cards">
        <div class="mode-card ${config.mode === 'noapi' ? 'selected' : ''}" data-mode="noapi">
          <i class="fa-solid fa-bolt"></i>
          <strong>Sem API</strong>
          <span>Gratuito — abre ChatGPT ou Perplexity</span>
        </div>
        <div class="mode-card ${config.mode === 'api' ? 'selected' : ''}" data-mode="api">
          <i class="fa-solid fa-microchip"></i>
          <strong>Com API</strong>
          <span>Responde direto no sistema</span>
        </div>
      </div>

      <div id="fw-api-section" style="display:${config.mode === 'api' ? 'block' : 'none'}">
        <div style="border-top:1px solid var(--border);margin:4px 0 20px"></div>

        <label class="modal-label">Provedor de IA</label>
        <div class="provider-cards">
          <div class="provider-card ${config.provider === 'gemini' ? 'selected' : ''}" data-provider="gemini">
            <i class="fa-brands fa-google"></i>
            <strong>Gemini</strong>
            <span>Google — Gratuito*</span>
          </div>
          <div class="provider-card ${config.provider === 'openai' ? 'selected' : ''}" data-provider="openai">
            <i class="fa-solid fa-robot"></i>
            <strong>ChatGPT</strong>
            <span>OpenAI — Pago</span>
          </div>
        </div>

        <label class="modal-label">Chave da API</label>
        <div style="position:relative">
          <input type="password" id="fw-inp-apikey"
            placeholder="${config.provider === 'openai' ? 'sk-...' : 'AIzaSy...'}"
            value="${config.apiKey}"
            style="padding-right:46px;margin-bottom:4px" />
          <button type="button" id="fw-toggleKeyBtn"
            style="position:absolute;right:12px;top:12px;background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px;padding:2px">
            <i class="fa-solid fa-eye"></i>
          </button>
        </div>
        <p style="font-size:12px;color:var(--muted);margin-bottom:16px" id="fw-key-hint">
          ${config.provider === 'openai'
            ? 'Obtenha em: <a href="https://platform.openai.com/api-keys" target="_blank" style="color:var(--blue)">platform.openai.com</a>'
            : 'Obtenha em: <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--blue)">aistudio.google.com</a>'}
        </p>
      </div>

      <div class="modal-btns">
        <button class="btn-secondary" id="fw-cancelConfigBtn">Cancelar</button>
        <button class="btn-primary" id="fw-saveConfigBtn">
          <i class="fa-solid fa-floppy-disk"></i> Salvar
        </button>
      </div>
    </div>`;

  overlay.addEventListener("click", e => { if (e.target === overlay) closeConfigModal(ctx); });

  overlay.querySelectorAll(".mode-card").forEach(card => {
    card.addEventListener("click", () => selectMode(ctx, card.dataset.mode, card));
  });

  overlay.querySelectorAll(".provider-card").forEach(card => {
    card.addEventListener("click", () => selectProvider(ctx, card.dataset.provider, card));
  });

  const toggleKeyBtn = overlay.querySelector("#fw-toggleKeyBtn");
  if (toggleKeyBtn) {
    toggleKeyBtn.addEventListener("click", () => toggleKey("fw-inp-apikey", toggleKeyBtn));
  }

  const cancelBtn = overlay.querySelector("#fw-cancelConfigBtn");
  if (cancelBtn) cancelBtn.addEventListener("click", () => closeConfigModal(ctx));

  const saveBtn = overlay.querySelector("#fw-saveConfigBtn");
  if (saveBtn) saveBtn.addEventListener("click", () => saveConfig(ctx));

  document.body.appendChild(overlay);

  const focusable = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const firstFocus = focusable[0];
  if (firstFocus) setTimeout(() => firstFocus.focus(), 50);
  const handleKeydown = (e) => {
    if (e.key === 'Escape') { closeConfigModal(ctx); if (prevFocus) prevFocus.focus(); return; }
    const isTab = e.key === 'Tab';
    if (!isTab || !focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  };
  overlay.addEventListener('keydown', handleKeydown);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) { closeConfigModal(ctx); if (prevFocus) prevFocus.focus(); } });
}

function selectMode(ctx, mode, el) {
  document.querySelectorAll(".mode-card").forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");
  const sec = document.getElementById("fw-api-section");
  if (sec) sec.style.display = mode === "api" ? "block" : "none";
}

function selectProvider(ctx, provider, el) {
  document.querySelectorAll(".provider-card").forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");
  const inp = document.getElementById("fw-inp-apikey");
  if (inp) { inp.placeholder = provider === "openai" ? "sk-..." : "AIzaSy..."; inp.value = ""; }
  const hint = document.getElementById("fw-key-hint");
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

function closeConfigModal(ctx) {
  document.getElementById("fw-configModal")?.remove();
}

function saveConfig(ctx) {
  const modeEl = document.querySelector(".mode-card.selected");
  const providerEl = document.querySelector(".provider-card.selected");

  ctx.config.mode = modeEl ? modeEl.dataset.mode : ctx.config.mode;

  if (ctx.config.mode === "api") {
    ctx.config.provider = providerEl ? providerEl.dataset.provider : ctx.config.provider;
    ctx.config.apiKey = document.getElementById("fw-inp-apikey")?.value.trim() || "";
    if (!ctx.config.provider) { ctx.utils.showToast("Selecione Gemini ou ChatGPT.", "info"); return; }
    if (!ctx.config.apiKey) { ctx.utils.showToast("Informe a chave da API.", "info"); return; }
  }

  localStorage.setItem(ctx.lsKey("futura-mode"), ctx.config.mode);
  localStorage.setItem(ctx.lsKey("futura-provider"), ctx.config.provider);
  localStorage.setItem(ctx.lsKey("futura-apikey"), ctx.config.apiKey);

  ctx.searchCache.clear();
  ctx.config.updateStatus(ctx);
  closeConfigModal(ctx);
  ctx.utils.showToast("Configurações salvas.", "success");
}
