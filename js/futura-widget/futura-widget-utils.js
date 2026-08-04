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
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  const icons = { error: "fa-circle-exclamation", success: "fa-circle-check", info: "fa-circle-info" };
  toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}" style="color:${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--blue)'}"></i> ${message}`;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3200);
}
