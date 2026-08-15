/*
 * Service Worker AIKNOW.WINE
 *
 * Strategia pensata per NON bloccare mai gli aggiornamenti:
 * l'HTML è sempre "network-first", quindi appena Render pubblica una nuova
 * versione l'utente la riceve al primo avvio con connessione, senza dover
 * aggiornare l'app dagli store.
 *
 * Le chiamate /api/ non vengono MAI messe in cache (dati personali e token).
 */

const VERSION = 'v1';
const SHELL_CACHE = `aiknow-shell-${VERSION}`;
const RUNTIME_CACHE = `aiknow-runtime-${VERSION}`;

// Risorse minime per avviare l'app anche offline
const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => { /* offline in fase di install: non bloccare */ })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k.startsWith('aiknow-') && k !== SHELL_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

const isApiRequest = (url) => url.pathname.startsWith('/api/');

// HTML: rete per prima, cache solo come rete di salvataggio offline
async function networkFirst(request) {
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put('/', fresh.clone());
    }
    return fresh;
  } catch (err) {
    const cached = await caches.match('/', { ignoreSearch: true });
    if (cached) return cached;
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>Offline</title>' +
      '<body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#2e081b;color:#fff;text-align:center">' +
      '<div><h1 style="font-size:18px">Sei offline</h1>' +
      '<p style="opacity:.7;font-size:14px">Ricollegati a internet per usare AIKNOW.WINE.</p></div></body>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
    );
  }
}

// Asset statici: rispondo dalla cache e aggiorno in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      // 'opaque' = risorsa cross-origin senza CORS (CDN): la conservo comunque
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) return cached;

  const network = await networkPromise;
  if (network) return network;
  return new Response('', { status: 504, statusText: 'Offline' });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo GET: POST/PUT/DELETE devono sempre passare dalla rete
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }

  // Le API non vengono mai intercettate né memorizzate
  if (url.origin === self.location.origin && isApiRequest(url)) return;

  // Navigazione (apertura app / cambio pagina)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Asset dell'app e CDN (Tailwind, Google Fonts, ecc.)
  if (url.protocol === 'http:' || url.protocol === 'https:') {
    event.respondWith(staleWhileRevalidate(request));
  }
});
