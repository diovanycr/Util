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
 * Escapa atributos HTML (para uso em value="" e similares).
 * Escapa &, <, >, " e ' para evitar XSS em atributos.
 */
export function escapeAttr(text) {
    return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Retorna true se o src de imagem for considerado seguro.
 * Aceita apenas https: e data:image/* (base64 de imagens coladas).
 */
function isSafeImageSrc(src) {
    if (!src || typeof src !== 'string') return false;
    const trimmed = src.trim();
    if (/^https:\/\//i.test(trimmed)) return true;
    if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(trimmed)) return true;
    return false;
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
                        if (isSafeImageSrc(src)) {
                            child.setAttribute('src', src);
                        } else {
                            // Remove imagem com src inseguro (javascript:, data:text/html, etc.)
                            node.removeChild(child);
                            return;
                        }
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

/**
 * Cria uma versão "debounce" de uma função: só executa após `delay` ms
 * sem novas invocações. Útil para inputs de busca que re-renderizam DOM.
 *
 * @param {Function} fn  Função a debouncar
 * @param {number}    delay Tempo de espera em ms (padrão: 250)
 * @returns {Function} Função debouncada com método .flush() para disparar imediato
 */
export function debounce(fn, delay = 250) {
    let timer = null;
    function debounced(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => { timer = null; fn.apply(this, args); }, delay);
        debounced._pending = () => !!timer;
    }
    debounced.flush = function (...args) {
        if (timer) { clearTimeout(timer); timer = null; fn.apply(this, args); }
    };
    return debounced;
}

/**
 * Paleta de cores para tags/categorias (cicla automaticamente).
 * As classes .tag-blue, .tag-green, etc. estão definidas em css/tags.css
 * e funcionam em light/dark mode.
 */
const TAG_COLORS = [
    'tag-blue', 'tag-green', 'tag-purple', 'tag-orange',
    'tag-pink', 'tag-teal', 'tag-red', 'tag-indigo'
];
let _tagUserId = '';
let _tagStorageKey = 'painelAtende_tagColors';
let _tagColorMap = {};
try {
    _tagColorMap = JSON.parse(localStorage.getItem(_tagStorageKey) || '{}');
} catch { _tagColorMap = {}; }

export function setTagColorUser(uid) {
    _tagUserId = uid || '';
    _tagStorageKey = _tagUserId ? `painelAtende_tagColors_${_tagUserId}` : 'painelAtende_tagColors';
    try {
        _tagColorMap = JSON.parse(localStorage.getItem(_tagStorageKey) || '{}');
    } catch { _tagColorMap = {}; }
}

export function getTagColor(tag) {
    if (!_tagColorMap[tag]) {
        const keys = Object.keys(_tagColorMap);
        _tagColorMap[tag] = TAG_COLORS[keys.length % TAG_COLORS.length];
        try {
            localStorage.setItem(_tagStorageKey, JSON.stringify(_tagColorMap));
        } catch {}
    }
    return _tagColorMap[tag];
}

/**
 * Normaliza o formato de soluções de um problema para garantir
 * que um array válido seja sempre retornado.
 * Converte strings legadas de copyText em objetos { label, text }.
 */
export function normalizeSolutions(item) {
    if (item.solutions && Array.isArray(item.solutions)) {
        return item.solutions.map(s => ({
            ...s,
            copyTexts: (s.copyTexts || (s.copyText ? [s.copyText] : [])).map(ct =>
                typeof ct === 'string' ? { label: '', text: ct } : ct
            )
        }));
    }
    if (item.solution) return [{ label: 'Solução 1', text: item.solution, status: 'confirmed', copyTexts: [] }];
    return [];
}

/**
 * Retorna o prefixo de saudação baseado na hora atual.
 * < 12: "Bom dia", < 18: "Boa tarde", >= 18: "Boa noite".
 * Centraliza a lógica que era duplicada em auth.js e messages.js.
 */
export function getGreetingPrefix(hour = new Date().getHours()) {
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
}

/**
 * Retorna a próxima faixa de saudação que entrará em vigor (para badges informativos).
 */
export function getNextGreetingChange(hour = new Date().getHours()) {
    if (hour < 12) return 'Muda automaticamente para Boa tarde às 12:00';
    if (hour < 18) return 'Muda automaticamente para Boa noite às 18:00';
    return 'Muda automaticamente para Bom dia às 00:00';
}

/**
 * Detecta se um item de mensagem é uma saudação automática (mensagens cuja
 * categoria/título/texto contém termos típicos de saudação).
 */
export function isGreetingMessage(item) {
    const cat = (item.category || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const text = (item.text || '').toLowerCase();
    return cat.includes('sauda') ||
        title.includes('bom dia') || title.includes('boa tarde') || title.includes('boa noite') ||
        text.includes('bom dia')  || text.includes('boa tarde')  || text.includes('boa noite');
}

