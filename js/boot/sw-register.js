/**
 * sw-register.js — Registro do Service Worker e notificação de atualização.
 *
 * Fluxo:
 *  1. Registra o SW normalmente no load da página.
 *  2. Detecta quando um novo SW fica em "waiting" (nova versão disponível).
 *  3. Exibe um toast não-obstrusivo com botão "Atualizar agora".
 *  4. Ao clicar, envia { type: 'SKIP_WAITING' } → SW ativa → página recarrega.
 */

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');

            // Verifica se já há um SW em espera ao carregar (ex.: aba reaberta)
            if (registration.waiting) {
                _showUpdateToast(registration.waiting);
            }

            // Detecta nova instalação de SW enquanto a página está aberta
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (!newWorker) return;

                newWorker.addEventListener('statechange', () => {
                    // 'installed' + controllerAtivo = novo SW aguardando, versão anterior rodando
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        _showUpdateToast(newWorker);
                    }
                });
            });

            // Quando o SW efetivamente assume controle (após SKIP_WAITING), recarrega
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });
        } catch (_err) {
            // Registro falhou (ex.: HTTPS ausente em dev) — ignora silenciosamente
        }
    });
}

/**
 * Exibe o toast de atualização disponível.
 * Reutiliza o sistema de toast do app se disponível; caso contrário, cria um próprio.
 *
 * @param {ServiceWorker} worker  O SW em estado "waiting"
 */
function _showUpdateToast(worker) {
    // Evita exibir múltiplos toasts
    if (document.getElementById('sw-update-toast')) return;

    const toast = document.createElement('div');
    toast.id = 'sw-update-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.style.cssText = [
        'position:fixed',
        'bottom:1.25rem',
        'left:50%',
        'transform:translateX(-50%)',
        'background:var(--color-surface, #1e1e2e)',
        'color:var(--color-text, #cdd6f4)',
        'border:1px solid var(--color-border, #313244)',
        'border-radius:0.75rem',
        'padding:0.75rem 1.25rem',
        'display:flex',
        'align-items:center',
        'gap:0.875rem',
        'box-shadow:0 4px 24px rgba(0,0,0,.45)',
        'font-size:0.9rem',
        'z-index:99999',
        'max-width:calc(100vw - 2rem)',
        'animation:sw-toast-in 0.25s ease',
    ].join(';');

    const msg = document.createElement('span');
    msg.textContent = '🔄 Nova versão disponível!';

    const btn = document.createElement('button');
    btn.id = 'sw-update-btn';
    btn.textContent = 'Atualizar agora';
    btn.style.cssText = [
        'background:var(--color-accent, #cba6f7)',
        'color:var(--color-bg, #1e1e2e)',
        'border:none',
        'border-radius:0.5rem',
        'padding:0.35rem 0.85rem',
        'font-size:0.85rem',
        'font-weight:600',
        'cursor:pointer',
        'white-space:nowrap',
    ].join(';');

    btn.addEventListener('click', () => {
        worker.postMessage({ type: 'SKIP_WAITING' });
        toast.remove();
    });

    // Injeta keyframe caso ainda não exista
    if (!document.getElementById('sw-toast-style')) {
        const style = document.createElement('style');
        style.id = 'sw-toast-style';
        style.textContent = '@keyframes sw-toast-in{from{opacity:0;transform:translateX(-50%) translateY(1rem)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
        document.head.appendChild(style);
    }

    toast.appendChild(msg);
    toast.appendChild(btn);
    document.body.appendChild(toast);
}
