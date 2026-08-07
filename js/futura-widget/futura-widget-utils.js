/**
 * futura-widget-utils.js — Helpers de escape, toast e loader
 */

export function _escHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text ?? "");
  return div.innerHTML;
}

export function _escAttr(text) {
  const A = String.fromCharCode(38);
  return String(text ?? "")
    .replace(/&/g, A + "amp;")
    .replace(/</g, A + "lt;")
    .replace(/>/g, A + "gt;")
    .replace(/"/g, A + "quot;")
    .replace(/'/g, A + "#39;");
}

export function showToast(message, type = "info") {
  const icons = { error: "fa-circle-exclamation", success: "fa-circle-check", info: "fa-circle-info" };
  const old = document.querySelector('.futura-toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'futura-toast toast-success';
  t.setAttribute('role', 'status');
  t.setAttribute('aria-live', 'polite');
  t.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}" style="margin-right:6px;color:${type === 'success' ? 'var(--success, #22c55e)' : type === 'error' ? 'var(--danger, #ef4444)' : 'var(--blue, #3b82f6)'}"></i>${message}`;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 500); }, 3200);
}
