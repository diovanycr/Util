(function () {
    try {
        var saved = localStorage.getItem('painelAtende_theme') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
    } catch (e) { /* localStorage indisponivel - usa tema claro padrao */ }
})();
