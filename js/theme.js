/**
 * theme.js — Modo escuro com persistência em localStorage
 */

const THEME_KEY = 'painelAtende_theme';

export function initTheme() {
    // Aplica tema salvo (antes de renderizar para evitar flash)
    const saved = localStorage.getItem(THEME_KEY) || 'light';
    applyTheme(saved);

    // Botão de alternância
    const btn = document.getElementById('btnTheme');
    if (btn) {
        btn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const next = isDark ? 'light' : 'dark';
            applyTheme(next);
            localStorage.setItem(THEME_KEY, next);
        });
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const futContainer = document.getElementById('futuraSearchWidgetContainer');
    if (futContainer) futContainer.setAttribute('data-theme', theme);
    
    const btn = document.getElementById('btnTheme');
    if (btn) {
        const isDark = theme === 'dark';
        btn.innerHTML = isDark
            ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>'
            : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
        btn.title = isDark ? 'Modo claro' : 'Modo escuro';
        btn.setAttribute('aria-label', isDark ? 'Ativar modo claro' : 'Ativar modo escuro');
        btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    }
}
