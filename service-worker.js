const CACHE='winn-v2-1';
const ASSETS=['./','index.html','archief.html','artikel.html','editie.html','styles.css','app.js','archive.js','article.js','edition.js','data/articles.json','data/editions.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('fetch',e=>e.respondWith(fetch(e.request).catch(()=>caches.match(e.request))));
