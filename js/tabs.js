import { el } from './firebase.js';

export function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

            const target = tab.dataset.tab;
            const content = el(target);
            if (content) content.classList.remove('hidden');
        });
    });
}
