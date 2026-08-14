/**
 * futura-widget-theme.js — Tema escuro/claro escopado ao widget
 */

export function initTheme(ctx) {
  const currentTheme = localStorage.getItem(ctx.lsKey('futura-theme')) || 'light';
  ctx.widgetScope.setAttribute('data-theme', currentTheme);
  updateThemeButton(ctx, currentTheme);
}

export function updateThemeButton(ctx, theme) {
  const themeBtn = ctx.widgetScope.querySelector('#fw-themeToggleBtn');
  if (!themeBtn) return;
  const icon = themeBtn.querySelector('i');
  const text = themeBtn.querySelector('span');
  if (theme === 'dark') {
    if (icon) icon.className = 'fa-solid fa-sun';
    if (text) text.textContent = 'Tema Claro';
  } else {
    if (icon) icon.className = 'fa-solid fa-moon';
    if (text) text.textContent = 'Tema Escuro';
  }
}

export function toggleTheme(ctx) {
  const currentTheme = ctx.widgetScope.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  ctx.widgetScope.setAttribute('data-theme', currentTheme);
  localStorage.setItem(ctx.lsKey('futura-theme'), currentTheme);
  updateThemeButton(ctx, currentTheme);
  ctx.utils.showToast(currentTheme === 'dark' ? 'Tema escuro ativado.' : 'Tema claro ativado.', 'success');
}
