import { el } from './firebase.js';

export function initTabs() {
    const tabs = document.querySelectorAll('.tab');

    // Estado inicial de acessibilidade
    tabs.forEach(tab => {
        const isActive = tab.classList.contains('active');
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        tab.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => activateTab(tab));

        // Navegação por setas entre abas (padrão WAI-ARIA tabs)
        tab.addEventListener('keydown', (e) => {
            const list = [...document.querySelectorAll('.tab')];
            const idx = list.indexOf(tab);
            let next = null;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                next = list[(idx + 1) % list.length];
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                next = list[(idx - 1 + list.length) % list.length];
            } else if (e.key === 'Home') {
                next = list[0];
            } else if (e.key === 'End') {
                next = list[list.length - 1];
            }
            if (next) {
                e.preventDefault();
                activateTab(next);
                next.focus();
            }
        });
    });
}

function activateTab(tab) {
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');

    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

    const target = tab.dataset.tab;
    const content = el(target);
    if (content) content.classList.remove('hidden');
}
