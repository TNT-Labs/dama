// Versione dell'app - incrementa questo numero ad ogni release
const APP_VERSION = 'v1.0.1';
const CACHE_NAME = `dama-${APP_VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './Style.css',
  './script.js',
  'https://cdn-icons-png.flaticon.com/512/3233/3233516.png'
];

// Installazione del Service Worker e salvataggio dei file in cache
self.addEventListener('install', (event) => {
  console.log('[SW] Installazione versione:', APP_VERSION);
  // skipWaiting forza il nuovo service worker ad attivarsi immediatamente
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching assets per versione:', APP_VERSION);
      return cache.addAll(ASSETS);
    })
  );
});

// Attivazione del Service Worker e pulizia delle vecchie cache
self.addEventListener('activate', (event) => {
  console.log('[SW] Attivazione versione:', APP_VERSION);

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Elimina tutte le cache che non corrispondono alla versione corrente
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminazione cache obsoleta:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Prende il controllo di tutte le pagine immediatamente
      return self.clients.claim();
    })
  );
});

// Gestione delle richieste: Network First con fallback su cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clona la risposta perché può essere consumata una sola volta
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Se la rete fallisce, usa la cache
        return caches.match(event.request);
      })
  );
});

// Messaggio per notificare l'aggiornamento disponibile
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});