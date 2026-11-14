const CACHE = 'winn-static-20261114';
const ASSETS = ['./', 'index.html', 'archief.html', 'artikel.html', 'editie.html', 'styles.css', 'toegang.css', 'app.js', 'publication.js', 'pricing.js', 'archive.js', 'article.js', 'edition.js', 'data/articles.json', 'data/editions.json'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('winn-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method === 'GET' && new URL(e.request.url).origin === self.location.origin) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request).then(cached => cached || Response.error())));
  }
});
