import { escapeHtml, getTagColor } from '../utils.js';

export function setupTagInput(input, pillsContainer) {
    if (!input || !pillsContainer) return;

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTagPill(input.value, pillsContainer);
            input.value = '';
        }
        if (e.key === 'Backspace' && input.value === '') {
            const last = pillsContainer.querySelector('.tag-pill:last-child');
            last?.remove();
        }
    });

    input.addEventListener('blur', () => {
        if (input.value.trim()) {
            addTagPill(input.value, pillsContainer);
            input.value = '';
        }
    });
}

export function addTagPill(text, container) {
    if (!container) return;
    const tag = text.trim().replace(/,/g, '').toLowerCase();
    if (!tag) return;
    const existing = [...container.querySelectorAll('.tag-pill')].map(p => p.dataset.tag);
    if (existing.includes(tag)) return;

    const pill = document.createElement('span');
    pill.className = `tag-pill ${getTagColor(tag)}`;
    pill.dataset.tag = tag;
    pill.innerHTML = `${escapeHtml(tag)} <button class="tag-pill-remove" title="Remover">&times;</button>`;
    pill.querySelector('.tag-pill-remove').onclick = () => pill.remove();
    container.appendChild(pill);
}

export function getTagsFromPills(container) {
    if (!container) return [];
    const el = container.closest('.tag-input-wrapper') || container;
    return [...el.querySelectorAll('.tag-pill')].map(p => p.dataset.tag).filter(Boolean);
}

export function renderTagPills(container, tags = [], removable = true) {
    container.innerHTML = '';
    tags.forEach(tag => {
        const pill = document.createElement('span');
        pill.className = `tag-pill ${getTagColor(tag)}`;
        pill.dataset.tag = tag;
        if (removable) {
            pill.innerHTML = `${escapeHtml(tag)} <button class="tag-pill-remove" title="Remover">&times;</button>`;
            pill.querySelector('.tag-pill-remove').onclick = () => pill.remove();
        } else {
            pill.textContent = tag;
        }
        container.appendChild(pill);
    });
}

export function normalizeTags(item) {
    if (Array.isArray(item.tags)) return item.tags;
    if (item.category && item.category !== 'Geral') return [item.category.toLowerCase()];
    return [];
}
