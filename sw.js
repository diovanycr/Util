/// <reference lib="webworker" />

const CACHE_NAME = 'painelatende-v111';

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
            './css/aiAssistant.css',
            './css/analytics.css',
            './css/apiTester.css',
            './css/base.css',
            './css/compact-favorites.css',
            './css/components.css',
            './css/decisionTree.css',
            './css/departments.css',
            './css/docValidator.css',
            './css/escPos.css',
            './css/fileValidator.css',
            './css/forms.css',
            './css/futura-widget.css',
            './css/help.css',
            './css/history.css',
            './css/links.css',
            './css/login.css',
            './css/main.css',
            './css/messages.css',
            './css/networkDiag.css',
            './css/portOpener.css',
            './css/problems.css',
            './css/scriptGen.css',
            './css/search.css',
            './css/statusChecker.css',
            './css/tags.css',
            './css/ticketSummary.css',
            './css/users.css',
            './js/app.js',
            './js/boot/sw-register.js',
            './js/boot/theme-fouc.js',
            './js/core/enhancements.js',
            './js/core/firebase-retry.js',
            './js/core/firebase.js',
            './js/core/modal.js',
            './js/core/shortcuts.js',
            './js/core/tabs.js',
            './js/core/theme.js',
            './js/core/toast.js',
            './js/core/utils.js',
            './js/modules/admin.js',
            './js/modules/aiAssistant.js',
            './js/modules/analytics.js',
            './js/modules/auth.js',
            './js/modules/help.js',
            './js/modules/history.js',
            './js/modules/links.js',
            './js/modules/messages.js',
            './js/modules/messages/import-export.js',
            './js/modules/messages/loader.js',
            './js/modules/messages/state.js',
            './js/modules/messages/trash.js',
            './js/modules/problems.js',
            './js/modules/problems/departments.js',
            './js/modules/problems/problem-edit.js',
            './js/modules/problems/problem-io.js',
            './js/modules/problems/problem-render.js',
            './js/modules/problems/solution-editor.js',
            './js/modules/problems/tags.js',
            './js/modules/ranking.js',
            './js/modules/search.js',
            './js/tools/apiTester.js',
            './js/tools/decisionTree.js',
            './js/tools/docValidator.js',
            './js/tools/docValidatorUI.js',
            './js/tools/escPos.js',
            './js/tools/esc-pos/builders.js',
            './js/tools/esc-pos/constants.js',
            './js/tools/esc-pos/generator.js',
            './js/tools/fileValidator.js',
            './js/tools/futura-widget.js',
            './js/tools/futura-widget/futura-widget-audio.js',
            './js/tools/futura-widget/futura-widget-config.js',
            './js/tools/futura-widget/futura-widget-modal.js',
            './js/tools/futura-widget/futura-widget-render.js',
            './js/tools/futura-widget/futura-widget-search.js',
            './js/tools/futura-widget/futura-widget-template.js',
            './js/tools/futura-widget/futura-widget-theme.js',
            './js/tools/futura-widget/futura-widget-utils.js',
            './js/tools/networkDiag.js',
            './js/tools/portOpener.js',
            './js/tools/port-opener/builders.js',
            './js/tools/port-opener/constants.js',
            './js/tools/port-opener/generator.js',
            './js/tools/port-opener/ports.js',
            './js/tools/scriptGen.js',
            './js/tools/statusChecker.js',
            './js/tools/ticketSummary.js'
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
