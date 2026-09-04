/**
 * Exibe um toast de feedback temporário com suporte a ações (ex: Desfazer)
 * @param {string} message - Mensagem a exibir
 * @param {string} [type] - Tipo opcional (info, error, success)
 * @param {any} [options] - Opções adicionais (actionText, onAction, duration)
 */
export function showToast(message, type = 'info', options = {}) {
    const old = document.querySelector('.toast-success');
    if (old) old.remove();

    const t = document.createElement('div');
    t.className = `toast-success toast-${type}`;
    t.setAttribute('role', 'status');
    t.setAttribute('aria-live', 'polite');

    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;
    t.appendChild(msgSpan);

    const opts = options || {};

    if (opts.actionText && typeof opts.onAction === 'function') {
        const actionBtn = document.createElement('button');
        actionBtn.className = 'toast-action-btn';
        actionBtn.type = 'button';
        actionBtn.style.marginLeft = '12px';
        actionBtn.style.background = 'transparent';
        actionBtn.style.border = '1px solid currentColor';
        actionBtn.style.color = 'inherit';
        actionBtn.style.borderRadius = '4px';
        actionBtn.style.padding = '2px 8px';
        actionBtn.style.cursor = 'pointer';
        actionBtn.textContent = opts.actionText;

        const onAct = opts.onAction;
        actionBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onAct();
            t.remove();
        });

        t.appendChild(actionBtn);
    }

    document.body.appendChild(t);

    const duration = opts.duration || 2000;
    setTimeout(() => {
        if (document.body.contains(t)) {
            t.style.opacity = '0';
            setTimeout(() => { if (document.body.contains(t)) t.remove(); }, 500);
        }
    }, duration);
}
