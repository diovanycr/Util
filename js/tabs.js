import { el } from './firebase.js';

export function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active de todas as abas
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Esconde todos os conteúdos de aba
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

            // Mostra o conteúdo correspondente
            const target = tab.dataset.tab;
            const content = el(target);
            if (content) content.classList.remove('hidden');
        });
    });
}
