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

/**
 * Adiciona suporte a reordenação via teclado em um elemento drag handle.
 *
 * Funcionamento:
 *  - Space / Enter no handle: entra/sai do modo de reordenação
 *  - ↑ / ↓ com modo ativo: move o item para cima ou para baixo na lista
 *  - Escape: cancela sem salvar
 *  - Um <span aria-live> anuncia a posição para screen readers
 *
 * @param {HTMLElement}         handle    - O elemento que serve de alça de drag (ex: .drag-handle)
 * @param {() => HTMLElement[]} getItems  - Função que retorna todos os itens irmãos ordenados
 * @param {() => void}          onReorder - Callback chamado após cada movimento para persistir a ordem
 */
export function addKeyboardDragSupport(handle, getItems, onReorder) {
    handle.setAttribute('tabindex', '0');
    handle.setAttribute('role', 'button');
    handle.setAttribute('aria-label', 'Mover item — pressione Espaço para iniciar e use as setas para reposicionar');

    // Criar announcer de screen reader (único por página)
    let announcer = document.getElementById('kbd-drag-announcer');
    if (!announcer) {
        announcer = document.createElement('span');
        announcer.id = 'kbd-drag-announcer';
        announcer.className = 'sr-only';
        announcer.setAttribute('aria-live', 'assertive');
        announcer.setAttribute('aria-atomic', 'true');
        document.body.appendChild(announcer);
    }

    const announce = (msg) => { announcer.textContent = ''; requestAnimationFrame(() => { announcer.textContent = msg; }); };

    handle.addEventListener('keydown', (e) => {
        const item = handle.closest('[draggable]');
        if (!item) return;

        const isActive = item.classList.contains('reorder-active');

        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (isActive) {
                // Confirmar reordenação
                item.classList.remove('reorder-active');
                handle.setAttribute('aria-label', 'Mover item — pressione Espaço para iniciar e use as setas para reposicionar');
                announce('Posição confirmada.');
                onReorder();
            } else {
                // Entrar no modo de reordenação
                item.classList.add('reorder-active');
                handle.setAttribute('aria-label', 'Reordenando — use ↑↓ para mover, Espaço para confirmar, Escape para cancelar');
                const items = getItems();
                const pos = items.indexOf(item) + 1;
                announce(`Reordenação ativa. Item na posição ${pos} de ${items.length}. Use as setas para mover.`);
            }
            return;
        }

        if (e.key === 'Escape' && isActive) {
            e.preventDefault();
            item.classList.remove('reorder-active');
            handle.setAttribute('aria-label', 'Mover item — pressione Espaço para iniciar e use as setas para reposicionar');
            announce('Reordenação cancelada.');
            return;
        }

        if (!isActive) return;

        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const items = getItems();
            const idx   = items.indexOf(item);
            const parent = item.parentNode;

            if (e.key === 'ArrowUp' && idx > 0) {
                parent.insertBefore(item, items[idx - 1]);
            } else if (e.key === 'ArrowDown' && idx < items.length - 1) {
                parent.insertBefore(item, items[idx + 1].nextSibling);
            }

            const newItems = getItems();
            const newPos   = newItems.indexOf(item) + 1;
            announce(`Posição ${newPos} de ${newItems.length}.`);
            handle.focus();
        }
    });
}
