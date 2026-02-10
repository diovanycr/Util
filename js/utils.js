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
