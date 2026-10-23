// BoSane — service worker : l'application s'ouvre même avec une connexion faible.
// Changez ce numéro à chaque nouvelle version de index.html.
const VERSION = 'bosane-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.hostname.endsWith('supabase.co')) return;             // données : toujours en direct
  if (req.mode === 'navigate') {                               // la page : réseau d'abord (mises à jour), sinon copie locale
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(k => k.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok && (url.origin === location.origin || url.hostname === 'cdn.jsdelivr.net')) { const c = r.clone(); caches.open(VERSION).then(k => k.put(req, c)); }
    return r;
  })));
});
