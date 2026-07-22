/**
 * Escapa HTML para evitar XSS ao inserir texto via innerHTML.
 * Reutilizado em messages.js e problems.js.
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Escapa atributos HTML (para uso em value="" e similares)
 */
export function escapeAttr(text) {
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Sanitiza HTML para permitir apenas tags puras e imagens seguras.
 */
export function sanitizeHtml(html) {
    const temp    = document.createElement('div');
    temp.innerHTML = html;
    const allowed = new Set(['IMG', 'BR', 'P', 'DIV', '#text']);
    function clean(node) {
        [...node.childNodes].forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                if (!allowed.has(child.tagName)) {
                    node.replaceChild(document.createTextNode(child.textContent), child);
                } else {
                    if (child.tagName === 'IMG') {
                        const src = child.getAttribute('src');
                        [...child.attributes].forEach(a => child.removeAttribute(a.name));
                        if (src) child.setAttribute('src', src);
                    } else {
                        [...child.attributes].forEach(a => child.removeAttribute(a.name));
                    }
                    clean(child);
                }
            }
        });
    }
    clean(temp);
    return temp.innerHTML;
}
