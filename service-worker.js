// Speichert nur die App-Hülle (HTML/Icons) für den Offline-Start.
// Die eigentlichen Daten kommen immer live von der Apps-Script-API.
const CACHE_NAME = 'rir-app-shell-v6';
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
  if (url.origin !== self.location.origin) return;

  // index.html: IMMER zuerst versuchen frisch zu laden, damit Updates sofort
  // ankommen. Nur wenn kein Netz da ist, wird die zwischengespeicherte
  // Version als Fallback verwendet.
  const isAppShellPage = event.request.mode === 'navigate' || url.pathname.endsWith('/index.html');
  if (isAppShellPage) {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
        return networkResponse;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Alles andere (Icons, Manifest, Logo): Cache-first reicht, ändert sich selten.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
