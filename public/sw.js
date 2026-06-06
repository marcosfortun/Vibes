// Service worker mínimo para que el navegador considere la app instalable (PWA).
// Sin caché por ahora; sólo activa el ciclo de vida.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
