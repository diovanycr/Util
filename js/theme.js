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
    const btn = document.getElementById('btnTheme');
    if (btn) {
        btn.innerHTML = theme === 'dark'
            ? '<i class="fa-solid fa-sun"></i>'
            : '<i class="fa-solid fa-moon"></i>';
        btn.title = theme === 'dark' ? 'Modo claro' : 'Modo escuro';
    }
}
