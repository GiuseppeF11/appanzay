// Cache per usare l'app anche offline (solo versione GitHub Pages).
// Il nome della cache viene aggiornato da scripts/bump_version.py a ogni rilascio.
const CACHE = 'appanzay-1.19.1';
const FILES = ['./', './index.html', './css/app.css', './js/version.js', './js/config.js', './js/foods.js', './js/app.js', './js/firebase.js', './manifest.webmanifest', './modello/piano-esempio.json', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/icon.svg', './icons/favicon.svg', './icons/favicon-32.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
// Rete prima (verificando sempre con il server, senza copie scadute), cache come riserva offline.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url), same = url.origin === location.origin;
  const sdk = url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/');
  if (same && url.pathname.endsWith('/version.json')) return; // sempre dal server
  e.respondWith(fetch(same ? new Request(req, { cache: 'no-cache' }) : req).then(r => {
    if ((same || sdk) && r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  }).catch(() => caches.match(req, { ignoreSearch: true })));
});
