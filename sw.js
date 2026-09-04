/// <reference lib="webworker" />

/**
 * sw.js — Service Worker do PainelAtende
 *
 * Pre-cache gerado automaticamente pelo script `scripts/generate-sw-manifest.js`
 * e lido em tempo de instalação a partir de `sw-manifest.json`.
 *
 * Fluxo de atualização seguro:
 *  1. Nova versão detectada → SW fica em estado "waiting" (NÃO ativa sozinho)
 *  2. `sw-register.js` exibe toast "Nova versão disponível"
 *  3. Usuário clica "Atualizar agora" → envia mensagem `{ type: 'SKIP_WAITING' }`
 *  4. SW chama `self.skipWaiting()` e a página recarrega
 */

const CACHE_PREFIX = 'painelatende';

/** @type {string} Cache name da versão atualmente instalada (preenchido no install) */
let _activeCacheName = CACHE_PREFIX;

// ── Install ───────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            // Lê o manifesto gerado pelo build para obter versão e lista de arquivos
            const manifestResp = await fetch('./sw-manifest.json', { cache: 'no-store' });
            if (!manifestResp.ok) throw new Error(`sw-manifest.json não encontrado: ${manifestResp.status}`);

            /** @type {{ version: string, files: string[] }} */
            const manifest = await manifestResp.json();
            const cacheName = `${CACHE_PREFIX}-${manifest.version}`;

            const cache = await caches.open(cacheName);
            // addAll falha atomicamente: se qualquer arquivo der 404, o install falha
            await cache.addAll(manifest.files);

            _activeCacheName = cacheName;

            console.log(`[SW] install: cache="${cacheName}" files=${manifest.files.length}`);
        })()
    );
    // ⚠️ NÃO chamar self.skipWaiting() aqui — ativação é controlada pelo usuário
});

// ── Activate ──────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const currentCache = _activeCacheName;

            // Remove todos os caches antigos deste app
            const keys = await caches.keys();
            await Promise.all(
                keys
                    .filter((k) => k.startsWith(CACHE_PREFIX) && k !== currentCache)
                    .map((k) => {
                        console.log(`[SW] delete old cache: ${k}`);
                        return caches.delete(k);
                    })
            );

            // Assume controle de todas as abas imediatamente após ativação
            await self.clients.claim();
            console.log(`[SW] activate: cache="${currentCache}" ativo.`);
        })()
    );
});

// ── Message (skip waiting controlado) ─────────────────────────────────────────

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        console.log('[SW] SKIP_WAITING recebido — ativando nova versão.');
        self.skipWaiting();
    }
});

// ── Fetch ─────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Cache-first para assets estáticos (CSS, JS, fonts, imagens)
    if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached;
                return fetch(event.request).then((response) => {
                    if (response && response.status === 200) {
                        // Adiciona ao cache corrente para requests não pré-cacheados
                        const clone = response.clone();
                        caches.keys().then((keys) => {
                            const current = keys.find((k) => k.startsWith(CACHE_PREFIX));
                            if (current) caches.open(current).then((c) => c.put(event.request, clone));
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // Network-first para HTML e chamadas de API (Firebase, etc.)
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.keys().then((keys) => {
                        const current = keys.find((k) => k.startsWith(CACHE_PREFIX));
                        if (current) caches.open(current).then((c) => c.put(event.request, clone));
                    });
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
