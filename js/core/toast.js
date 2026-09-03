/**
 * Exibe um toast de feedback temporário (desaparece após 2s)
 * @param {string} message - Mensagem a exibir
 * @param {string} [type] - Tipo opcional (info, error, success)
 */
export function showToast(message, type) {
    const old = document.querySelector('.toast-success');
    if (old) old.remove();
    const t = document.createElement('div');
    t.className = 'toast-success';
    t.setAttribute('role', 'status');
    t.setAttribute('aria-live', 'polite');
    t.innerText = message;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 500); }, 2000);
}
