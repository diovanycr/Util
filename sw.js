const CACHE_NAME = 'painelatende-v3';

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
            './js/app.js',
            './js/firebase.js',
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
            './js/docValidatorUI.js',
            './js/statusChecker.js',
            './js/apiTester.js',
            './js/fileValidator.js',
            './js/ticketSummary.js',
            './js/decisionTree.js',
            './js/networkDiag.js',
            './js/scriptGen.js',
            './js/history.js'
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
      Promise.all(keys.filter((key) => key !== CACHE_NAME && key !== CACHE_NAME + '-static').map((key) => caches.delete(key))          )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Cache-first para assets estáticos
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