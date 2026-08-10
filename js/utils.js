/**
 * Escapa HTML para evitar XSS ao inserir texto via innerHTML.
 * Reutilizado em messages.js e problems.js.
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text ?? '');
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
 * Configura drag-and-drop de mouse + teclado em um card reordenável.
 * Centraliza o padrão duplicado em messages, problems e links.
 *
 * @param {HTMLElement} card       - Elemento arrastável
 * @param {HTMLElement} handle     - Alça de drag (para teclado)
 * @param {HTMLElement} list       - Container onde a ordem será salva
 * @param {() => HTMLElement[]} getSiblings - Retorna cards irmãos na ordem atual
 * @param {() => void} onReorder   - Callback após drag (salvar ordem)
 * @param {(target: HTMLElement) => boolean} [canDrop] - Validação opcional (ex: mesmo grupo)
 */
export function setupDragDrop(card, handle, list, getSiblings, onReorder, canDrop) {
    card.draggable = true;
    card.ondragstart = () => { card._dragSrc = card; card.classList.add('dragging'); };
    card.ondragend   = () => { card.classList.remove('dragging'); card._dragSrc = null; onReorder(); };
    card.ondragover  = (e) => {
        e.preventDefault();
        const src = card._dragSrc;
        if (!src || src === card) return;
        if (canDrop && !canDrop(card)) return;
        const rect = card.getBoundingClientRect();
        const after = e.clientY > rect.top + rect.height / 2;
        card.parentNode.insertBefore(src, after ? card.nextSibling : card);
    };

    if (handle) {
        addKeyboardDragSupport(handle, getSiblings, onReorder);
    }
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

/**
 * Inicializa um segmented control (radiogroup) acessível.
 * Gerencia clique, setas (ArrowRight/Left/Up/Down), Home/End,
 * atualiza aria-checked, tabindex e a classe .active.
 *
 * @param {HTMLElement} group - Container do segmented (role="radiogroup")
 * @param {(btn: HTMLButtonElement) => void} onSelect - Callback ao selecionar um botão
 * @param {string} [btnSelector='.po-seg-btn'] - Seletor dos botões internos
 */
export function setupSegmented(group, onSelect, btnSelector = '.po-seg-btn') {
    if (!group) return null;
    const radios = () => [...group.querySelectorAll(btnSelector)];
    const select = (btn) => {
        radios().forEach(b => {
            const active = b === btn;
            b.classList.toggle('active', active);
            b.setAttribute('aria-checked', active ? 'true' : 'false');
            b.setAttribute('tabindex', active ? '0' : '-1');
        });
        onSelect(btn);
        btn.focus();
    };
    group.addEventListener('click', e => {
        const btn = e.target.closest(btnSelector);
        if (btn) select(btn);
    });
    group.addEventListener('keydown', e => {
        const list = radios();
        const idx = list.indexOf(document.activeElement);
        let next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = list[(idx + 1) % list.length];
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = list[(idx - 1 + list.length) % list.length];
        else if (e.key === 'Home') next = list[0];
        else if (e.key === 'End') next = list[list.length - 1];
        if (next) { e.preventDefault(); select(next); }
    });
    return { select, radios };
}

/**
 * Cria uma função de highlight de sintaxe reutilizável.
 *
 * O algoritmo escapa HTML primeiro, depois aplica cada regra em ordem
 * "stashando" os spans em placeholders para que regex posteriores não
 * apliquem spans dentro de spans já criados.
 *
 * @param {Array<{regex: RegExp, cls?: string, transform?: (match: string, ...groups: string[]) => string}>} rules
 *   Lista de regras (aplicadas em ordem). Se `cls` for informado, o match
 *   inteiro ganha `<span class="po-c-cls">`. Se `transform` for informado,
 *   ele recebe (match, ...groups) e devolve o HTML (use o helper `span`).
 * @returns {(code: string) => string} Função que recebe código e devolve HTML.
 */
export function createHighlighter(rules) {
    const span = (cls, content) => `<span class="po-c-${cls}">${content}</span>`;
    return (code) => {
        const tokens = [];
        const stash = html => `\u0000${tokens.push(html) - 1}\u0000`;
        const e = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        let src = e(code);
        for (const { regex, cls, transform } of rules) {
            src = src.replace(regex, (...args) => {
                const match = args[0];
                if (typeof transform === 'function') return transform(match, ...args.slice(1, -2), stash, span);
                if (cls) return stash(span(cls, match));
                return match;
            });
        }
        for (let i = tokens.length - 1; i >= 0; i--) {
            src = src.replace(`\u0000${i}\u0000`, tokens[i]);
        }
        return src;
    };
}

/**
 * Define o conteúdo de um <pre> de código, guardando o texto cru em `el._raw`
 * e aplicando realce de sintaxe através do highlighter informado.
 *
 * @param {string} id - id do elemento <pre>
 * @param {string} text - código a exibir
 * @param {(code: string) => string} highlighter - função retornada por createHighlighter
 */
export function setCode(id, text, highlighter) {
    const el = document.getElementById(id);
    if (!el) return;
    el._raw = text;
    el.innerHTML = highlighter(text);
}

/**
 * Configura abas (tabs) com ativação por clique + teclado (setas/Home/End).
 * Centraliza o padrão duplicado em escPos.js e portOpener.js.
 *
 * @param {HTMLElement} container - Container onde buscar as abas e paineis
 * @param {string} tabSelector - Seletor CSS dos elementos tab
 * @param {string} paneIdPrefix - Prefixo do ID do painel (ex: 'escPane-' ou 'poPane-')
 * @param {string} [keydownScope] - Seletor extra para limitar o keydown (ex: '#poTool-portopener')
 */
export function setupOutputTabs(container, tabSelector, paneIdPrefix, keydownScope) {
    const tabs = () => [...container.querySelectorAll(tabSelector)];

    const activate = (tab) => {
        tabs().forEach(t => {
            const active = t === tab;
            t.classList.toggle('active', active);
            t.setAttribute('aria-selected', active ? 'true' : 'false');
            t.setAttribute('tabindex', active ? '0' : '-1');
        });
        container.querySelectorAll(`[id^="${paneIdPrefix}"]`).forEach(p => p.classList.add('hidden'));
        document.getElementById(`${paneIdPrefix}${tab.dataset.pane}`)?.classList.remove('hidden');
        tab.focus();
    };

    container.addEventListener('keydown', e => {
        const scopeCheck = keydownScope ? e.target.closest(keydownScope) : e.target.closest(tabSelector);
        if (!scopeCheck) return;
        const list = tabs();
        const idx = list.indexOf(e.target);
        let next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = list[(idx + 1) % list.length];
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = list[(idx - 1 + list.length) % list.length];
        else if (e.key === 'Home') next = list[0];
        else if (e.key === 'End') next = list[list.length - 1];
        if (next) { e.preventDefault(); activate(next); }
    });

    container.addEventListener('click', e => {
        const tab = e.target.closest(tabSelector);
        if (tab) activate(tab);
    });
}

/**
 * Atualiza o elemento de badge de status com classes padronizadas.
 * Estados suportados: 'pending', 'ok', 'error', 'info'
 * Classes aplicadas: 'status-badge', 'status-pending', 'status-ok', 'status-error', 'status-info'
 *
 * @param {HTMLElement} el - Elemento span/div a atualizar
 * @param {'pending'|'ok'|'error'|'info'} state - Estado do status
 * @param {string} [text] - Texto opcional a definir no elemento
 */
export function setStatusBadge(el, state, text) {
    if (!el) return;
    const states = ['pending', 'ok', 'error', 'info'];
    el.className = 'status-badge ' + (states.includes(state) ? `status-${state}` : 'status-pending');
    if (text !== undefined) el.textContent = text;
}

/**
 * Executa uma função assíncrona com estado de loading no botão.
 * Desabilita o botão, mostra spinner + texto opcional, restaura ao finalizar.
 *
 * @param {HTMLButtonElement} btn - Botão a modificar
 * @param {Function} fn - Função assíncrona a executar
 * @param {string} [loadingText] - Texto a mostrar durante loading (padrão: "Carregando...")
 * @returns {Promise} Promise da função executada
 */
export async function withButtonLoading(btn, fn, loadingText = 'Carregando...') {
    if (!btn) return fn();
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></span> ${loadingText}`;
    try {
        return await fn();
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}

