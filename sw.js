const CACHE_NAME = 'painelatende-v4';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json'
      ]).then(() => {
        return caches.open(CACHE_NAME + '-static').then((staticCache) => {
          return staticCache.addAll([
            './css/base.css',
            './css/messages.css',
            './css/problems.css',
            './css/login.css',
            './css/components.css',
            './css/forms.css',
            './css/search.css',
            './css/users.css',
            './css/tags.css',
            './css/portOpener.css',
            './css/help.css',
            './css/history.css',
            './css/escPos.css',
            './css/scriptGen.css',
            './css/compact-favorites.css',
            './css/apiTester.css',
            './css/decisionTree.css',
            './css/docValidator.css',
            './css/fileValidator.css',
            './css/futura-widget.css',
            './css/links.css',
            './css/networkDiag.css',
            './css/statusChecker.css',
            './css/ticketSummary.css',
            './js/app.js',
            './js/firebase.js',
            './js/firebase-retry.js',
            './js/auth.js',
            './js/messages.js',
            './js/problems.js',
            './js/links.js',
            './js/search.js',
            './js/tabs.js',
            './js/modal.js',
            './js/toast.js',
            './js/utils.js',
            './js/theme.js',
            './js/help.js',
            './js/shortcuts.js',
            './js/enhancements.js',
            './js/admin.js',
            './js/portOpener.js',
            './js/escPos.js',
            './js/docValidator.js',
            './js/docValidatorUI.js',
            './js/statusChecker.js',
            './js/apiTester.js',
            './js/fileValidator.js',
            './js/ticketSummary.js',
            './js/decisionTree.js',
            './js/networkDiag.js',
            './js/scriptGen.js',
            './js/history.js',
            './js/futura-widget.js',
            './js/messages/state.js',
            './js/messages/loader.js',
            './js/messages/import-export.js',
            './js/messages/trash.js',
            './js/port-opener/constants.js',
            './js/port-opener/builders.js',
            './js/port-opener/generator.js',
            './js/port-opener/ports.js',
            './js/esc-pos/constants.js',
            './js/esc-pos/builders.js',
            './js/esc-pos/generator.js',
            './js/futura-widget/futura-widget-audio.js',
            './js/futura-widget/futura-widget-config.js',
            './js/futura-widget/futura-widget-modal.js',
            './js/futura-widget/futura-widget-render.js',
            './js/futura-widget/futura-widget-search.js',
            './js/futura-widget/futura-widget-template.js',
            './js/futura-widget/futura-widget-theme.js',
            './js/futura-widget/futura-widget-utils.js',
            './js/problems/problem-edit.js',
            './js/problems/problem-io.js',
            './js/problems/problem-render.js',
            './js/problems/solution-editor.js',
            './js/problems/tags.js'
          ]);
        });
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME && key !== CACHE_NAME + '-static').map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Cache-first para assets estaticos
  if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME + '-static').then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }
  
  // Network-first para HTML e API
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});
