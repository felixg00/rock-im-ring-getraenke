// Speichert nur die App-Hülle (HTML/Icons) für den Offline-Start.
// Die eigentlichen Daten kommen immer live von der Apps-Script-API.
const CACHE_NAME = 'rir-app-shell-v3';
const SHELL_FILES = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png', './logo-rir.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Nur die App-Hülle aus dem Cache bedienen, niemals API-Aufrufe (andere Domain) abfangen.
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
